const { prompt } = require('inquirer')
const chalk = require('chalk')
const { existsSync, removeSync, copySync } = require('fs-extra')
const { execSync, spawn } = require('child_process')
const path = require('path')
const dotenv = require('dotenv')

const { testNow } = require('./helpers')
const { CONFIGS } = require('./constants')
const { deployQuestions } = require('./questions')

async function deploy(name, cmdObject) {
  const useEnv = cmdObject.env
  const useSecrets = cmdObject.secrets
  let configs = {}

  try {
    testNow()
  } catch (e) {
    return console.log(chalk.bold.red(e.message))
  }

  let envPath

  // set config with env if enabled
  if (useEnv) {
    // use current working directory if no file path passed
    if (typeof useEnv === 'boolean') envPath = path.join(process.cwd(), '.env')
    // if env includes .env file then use as is, otherwise, assume directory and add .env extension
    else
      envPath = path.basename(useEnv).includes('.env')
        ? useEnv
        : path.join(useEnv, '.env')

    // if can't find the env file then end script
    if (!existsSync(envPath)) {
      return console.log(
        chalk.red.bold(`No .env file found: ${path.dirname(envPath)}`)
      )
    }

    // set configs and process.env using .env file
    const { parsed: envVars } = dotenv.config({ path: envPath })
    configs = { ...envVars }
  }

  const answers = await prompt(deployQuestions)

  if (useSecrets) {
    const secrets = execSync('now secrets list').toString()
    const enabled = []
    for (const key in CONFIGS) {
      if (secrets.includes(key.toLowerCase())) {
        configs[key] = `@${key.toLowerCase()}`
        enabled.push(configs[key])
      }
    }
    if (enabled.length)
      console.log(chalk`Using now secrets: {bold ${enabled.join(', ')}}`)
  }

  if (answers.customConfigs) {
    if (answers.config === 'time') configs.TIME_CAVEAT = true
    else if (answers.config === 'origin') configs.ORIGIN_CAVEAT = true
  }

  if (answers.minAmount) configs.MIN_AMOUNT = answers.minAmount
  if (answers.type === 'hodl') configs.BOLTWALL_HODL = true
  if (answers.route) configs.BOLTWALL_PATH = answers.route
  if (answers.protected) configs.BOLTWALL_PROTECTED_URL = answers.protected
  if (answers.rate) configs.BOLTWALL_RATE = answers.rate
  if (answers.oauth) configs.BOLTWALL_OAUTH = answers.oauth
  runNow(configs, name)
}

function runNow(configs, name) {
  const args = ['--prod', '--confirm']
  let nowFilesDir = path.join(__dirname, '../now-files')
  // default deployment directory to the nowFilesDir
  let projectDir = nowFilesDir

  // since --name has been deprecated in now
  // we will create a symlink to now-files
  if (name) {
    projectDir = path.join(process.cwd(), name)
    // copy projectDir if it exists
    if (existsSync(projectDir) && projectDir !== nowFilesDir)
      removeSync(projectDir)
    copySync(nowFilesDir, projectDir)
  }

  for (const key in configs) {
    if (configs[key]) {
      const option = `${key}=${configs[key]}`
      args.push('-e', `${option}`)
    }
  }

  console.log(chalk`Running with command: {bold.cyan now ${args.join(' ')}}`)

  const cp = spawn('now', args, { cwd: projectDir })
  cp.stdout.on('data', data => {
    console.log(`${data}`)
  })

  cp.stderr.on('data', data => {
    console.error(`${data}`)
  })

  cp.on('error', err => console.error('now-cli encountered an error:', err))

  cp.on('close', code => {
    // cleanup named now-files directory and
    // make sure we're not deleting the actual now-files
    if (name && projectDir !== nowFilesDir) removeSync(projectDir)
    if (code !== 0) console.log(`now-cli exited with code ${code}`)
    return
  })
}

module.exports = deploy

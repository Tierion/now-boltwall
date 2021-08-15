const { prompt } = require('inquirer')
const chalk = require('chalk')
const { existsSync, removeSync, copySync } = require('fs-extra')
const { execSync, spawn } = require('child_process')
const path = require('path')
const dotenv = require('dotenv')

const { testVercel } = require('./helpers')
const { CONFIGS, CONFIG_KEYS } = require('./constants')
const { deployQuestions } = require('./questions')

async function deploy(name, cmdObject) {
  const useEnv = cmdObject.env
  const useSecrets = cmdObject.secrets
  let configs = {}

  try {
    testVercel()
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
    const secrets = execSync('vercel secrets list').toString()
    const enabled = []
    for (const key in CONFIGS) {
      if (secrets.includes(key.toLowerCase())) {
        configs[key] = `@${key.toLowerCase()}`
        enabled.push(configs[key])
      }
    }
    if (enabled.length)
      console.log(chalk`Using vercel secrets: {bold ${enabled.join(', ')}}`)
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
  runNow(configs, name, answers.dev)
}

function runNow(configs, name, dev) {
  const args = []

  if (dev) args.push('dev')
  else args.push('--prod')

  args.push('--confirm')

  let nowFilesDir = path.join(__dirname, '../now-files')
  // default deployment directory to the nowFilesDir
  let projectDir = nowFilesDir

  // since --name has been deprecated in vercel
  // we will create a symlink to now-files
  if (name) {
    projectDir = path.join(process.cwd(), name)
    // remove .vercel file in now-files if it exists since the project
    // name will default to that
    const vercelDir = path.join(nowFilesDir, '.vercel')

    if (existsSync(vercelDir)) {
      removeSync(vercelDir)
    }

    // copy projectDir if it exists
    if (existsSync(projectDir) && projectDir !== nowFilesDir)
      removeSync(projectDir)
    copySync(nowFilesDir, projectDir)
  }

  // for local dev the environment variables go
  // into the environment rather than passed in the command
  const envVars = {}
  if (dev) {
    for (const key in configs) {
      if (configs[key]) {
        envVars[key] = configs[key]
      }
    }
  } else {
    for (const key in configs) {
      if (configs[key]) {
        const option = `${key}=${configs[key]}`
        args.push('-e', `${option}`)
      }
    }
  }

  // cleanup output to avoid printing sensitive values
  const printableArgs = [...args].map(arg => {
    const sensitiveArgs = [
      CONFIG_KEYS.LND_MACAROON,
      CONFIG_KEYS.LND_TLS_CERT,
      CONFIG_KEYS.SESSION_SECRET,
      CONFIG_KEYS.OPEN_NODE_KEY,
    ]

    for (const sensitive of sensitiveArgs) {
      if (arg.includes(sensitive)) {
        return `${sensitive}=[PROTECTED]`
      }
    }
    return arg
  })

  console.log(
    chalk`Running with command: {bold.cyan vercel ${printableArgs.join(' ')}}`
  )

  const cp = spawn('vercel', args, {
    cwd: projectDir,
    env: { ...process.env, ...envVars },
  })
  cp.stdout.on('data', data => {
    console.log(`${data}`)
  })

  cp.stderr.on('data', data => {
    console.error(`${data}`)
  })

  cp.on('error', err => console.error('vercel encountered an error:', err))

  cp.on('close', code => {
    // cleanup named now-files directory and
    // make sure we're not deleting the actual now-files
    if (name && projectDir !== nowFilesDir) removeSync(projectDir)
    if (code !== 0) console.log(`vercel exited with code ${code}`)
    return
  })
}

module.exports = deploy

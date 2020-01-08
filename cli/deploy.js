const { prompt } = require('inquirer')
const chalk = require('chalk')
const { existsSync } = require('fs')
const { execSync, spawn } = require('child_process')
const path = require('path')
const dotenv = require('dotenv')

const { testNow } = require('./helpers')
const { CONFIGS } = require('./constants')

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

  // if no path passed then we look for one in cwd
  if (useEnv && typeof useEnv === 'boolean')
    envPath = path.join(process.cwd(), '.env')
  else if (useEnv) envPath = path.join(useEnv, '.env')

  if (useEnv && !existsSync(envPath)) {
    return console.log(
      chalk.red.bold(`No .env file found: ${path.dirname(envPath)}`)
    )
  }

  const answers = await prompt([
    {
      type: 'confirm',
      name: 'customConfigs',
      message: 'Use custom restriction configs (e.g. time or origin based)?',
    },
    {
      type: 'list',
      name: 'config',
      when: hash => hash.customConfigs,
      message:
        'Choose a pre-build configuration for access restrictions (see https://github.com/Tierion/boltwall for more information):',
      choices: [
        { name: 'None', value: false },
        { name: 'TIME_CAVEAT_CONFIGS', value: 'time' },
        { name: 'ORIGIN_CAVEAT_CONFIGS', value: 'origin' },
      ],
    },
    {
      type: 'number',
      name: 'minAmount',
      mesage: 'Minimum amount for invoice generation',
      default: 1,
    },
    {
      type: 'list',
      name: 'type',
      message: 'Normal paywall or hodl? (if unsure pick normal)',
      choices: [
        { name: 'Normal', value: 'normal' },
        { name: 'HODL Invoice', value: 'hodl' },
      ],
    },
  ])

  if (useEnv) {
    const { parsed: envVars } = dotenv.config({ path: envPath })
    configs = { ...envVars }
  }

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

  let cmd = `now`
  const options = []

  if (name) {
    options.push('--name', name)
  }

  for (const key in configs) {
    if (configs[key]) {
      const option = `${key}=${configs[key]}`
      options.push('-e', `${option}`)
    }
  }

  console.log(chalk`Running with command: {bold.cyan now ${options.join(' ')}}`)

  options.push(path.join(__dirname, '..'))

  const cp = spawn('now', options)
  cp.stdout.on('data', data => {
    console.log(`${data}`)
  })

  cp.stderr.on('data', data => {
    console.error(`${data}`)
  })

  cp.on('close', code => {
    if (code !== 0) console.log(`now-cli exited with code ${code}`)
    return
  })
}

module.exports = deploy

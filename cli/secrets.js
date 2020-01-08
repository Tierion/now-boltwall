const { prompt } = require('inquirer')
const chalk = require('chalk')
const { execSync } = require('child_process')
const { existsSync, readFileSync, writeFileSync } = require('fs')
const path = require('path')
const os = require('os')
const crypto = require('crypto')

const { testNow } = require('./helpers')
const { CONFIGS } = require('./constants')
const { secretsQuestions } = require('./questions')
async function secrets() {
  const answers = await prompt(secretsQuestions)

  let configs = {
    ...CONFIGS,
  }

  let getConfigs
  let source = answers.source

  if (source === 'btcpay') getConfigs = configsFromBTCPay
  else if (source === 'opennode') getConfigs = configsFromOpenNode
  else getConfigs = configsFromInput

  try {
    const newConfigs = await getConfigs()
    configs = { ...configs, ...newConfigs }
  } catch (e) {
    return console.log(chalk.red.bold(e.message))
  }

  if (answers.secret) {
    configs.SESSION_SECRET = answers.secret
  } else {
    configs.SESSION_SECRET = crypto.randomBytes(32).toString('hex')
  }

  if (answers.now) {
    try {
      await saveNowSecrets(configs)
    } catch (e) {
      console.error(
        chalk`{bold Problem saving now secrets:} {red.bold ${e.message}}`
      )
      return
    }
  }

  if (answers.env) {
    try {
      await saveEnvFile(answers.filePath, configs)
    } catch (e) {
      console.error(
        chalk`{bold Problem saving env file:} {red.bold ${e.message}}`
      )
      return
    }
  }
}

async function configsFromOpenNode() {
  const { key } = await prompt({
    type: 'input',
    name: 'key',
    message: 'OpenNode Api Key (https://developers.opennode.com/docs):',
    validate: input => {
      if (input.length) return true
      return 'Must pass API key.'
    },
  })
  return { OPEN_NODE_KEY: key }
}

async function configsFromBTCPay() {
  const { url } = await prompt({
    type: 'input',
    name: 'url',
    message:
      'URL of BTCPay Server config (See readme for instructions: https://github.com/tierion/now-boltwall#btcpay-server-configuration):',
    validate: input => {
      if (input.indexOf('https://') !== 0) {
        return chalk.red('Invalid URL, must start with "https://"')
      }
      try {
        execSync(`curl -s ${input}`)
        return true
      } catch (err) {
        return chalk.red('Could not reach url. Please check it is valid')
      }
    },
  })

  return await readBtcPayConfig(url)
}

async function configsFromInput() {
  const configs = {}
  console.log('\n')
  console.log(
    chalk.bold(
      'You will be asked to manually provide your connection credentials. Hex, base64, and file paths are all supported.\n\
If you are unsure of how to obtain this information, try this tool: https://lightningjoule.com/tools/node-info'
    )
  )
  console.log('\n')
  const answers = await prompt([
    {
      name: 'socket',
      type: 'input',
      message: 'Connection socket. Usually of the form [HOST]:[PORT]',
      validate: input => {
        if (input.length) return true
        return chalk.red.bold('Connection information required')
      },
    },
    {
      name: 'macaroon',
      type: 'input',
      message:
        'Admin macaroon. Required if macaroons are enabled for security on your node',
    },
    {
      name: 'cert',
      type: 'input',
      message:
        'TLS Cert for making secure connection with node. Required if enabled on node.',
    },
  ])

  configs.LND_SOCKET = answers.socket

  if (answers.macaroon) {
    configs.LND_MACAROON = getCredential(answers.macaroon)
    if (!configs.LND_MACAROON) {
      return console.log(
        chalk.bold.red(
          'Invalid value passed for macaroon. Must be base64, hex, or valid path'
        )
      )
    }
  }

  if (answers.cert) {
    configs.LND_TLS_CERT = getCredential(answers.cert)
    if (!configs.LND_TLS_CERT) {
      return console.log(
        chalk.bold.red(
          'Invalid value passed for tls cert. Must be base64, hex, or valid path'
        )
      )
    }
  }
  return configs
}

function getCredential(cred) {
  if (cred[0] === '~') {
    cred = cred = path.join(os.homedir(), cred.slice(1, cred.length))
  }

  if (existsSync(path.resolve(cred))) {
    return readFileSync(cred).toString('hex')
  } else {
    if (Buffer.from(cred, 'hex').toString('hex') === cred) return cred.trim()
    if (Buffer.from(cred, 'base64').toString('base64') === cred)
      return cred.trim()
  }
}

async function readBtcPayConfig(url) {
  let config = execSync(`curl -s ${url}`)

  try {
    config = JSON.parse(config.toString())
  } catch (e) {
    throw new Error(
      'Problem reading config at that URL. Make sure the URL is still valid (they expire after 10 minutes)'
    )
  }

  config = config.configurations.find(c => c.type === 'grpc')

  if (!config)
    throw new Error(
      'Could not find valid grpc config. Make sure your BTCPay Server is using LND.'
    )

  return {
    LND_SOCKET: `${config.host}:${config.port}`,
    LND_MACAROON: config.adminMacaroon,
  }
}

async function saveNowSecrets(configs) {
  testNow()

  const configKeys = Object.keys(configs).map(key => key.toLowerCase())

  const secrets = execSync('now secrets list').toString()
  const exists = configKeys.filter(key => secrets.includes(key))

  // remove existing secrets to avoid any conflicts
  if (exists.length) {
    console.log(
      `The following boltwall/lnd connection secrets are already set and will be removed first: ${chalk.red.bold(
        exists.join(', ')
      )}`
    )
    const { cont } = await prompt({
      name: 'cont',
      type: 'confirm',
      message: `Would you like to continue? (This action cannot be reversed)`,
    })

    if (!cont) return

    for (const secret of exists) {
      console.log(chalk.bold(`Deleting ${secret}...`))
      const resp = execSync(`now secrets rm -y ${secret}`)
      console.log(resp.toString())
    }
  }

  console.log(chalk.bold('Setting now secrets'))
  for (const secret in configs) {
    if (!configs[secret]) continue

    console.log(chalk.bold(`Setting ${secret.toLowerCase()}`))
    const resp = execSync(
      `now secrets add ${secret.toLowerCase()} "${configs[secret]}"`
    )
    console.log(resp.toString())
  }
}

async function saveEnvFile(fileDir, configs) {
  const filePath = path.join(fileDir, '.env')

  if (existsSync(filePath)) {
    const { confirm } = await prompt({
      type: 'confirm',
      name: 'confirm',
      message: chalk`File already exists at {red.bold ${filePath}} and will be overwritten. Continue?`,
    })

    if (!confirm) return
  }

  let content = ''

  for (const key in configs) {
    if (!configs[key]) continue
    content += `${key.toUpperCase()}=${configs[key]}\n`
  }

  writeFileSync(filePath, content)
  console.log(`Env file written to: ${filePath}`)
}
module.exports = secrets

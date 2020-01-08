const secretsQuestions = [
  {
    type: 'list',
    name: 'source',
    message: 'How would you like to load your LND connection details?',
    choices: [
      { name: 'BTCPay Server', value: 'btcpay' },
      { name: 'File path or raw values', value: 'raw' },
      { name: 'Open node API key', value: 'opennode' },
    ],
  },
  {
    type: 'confirm',
    name: 'now',
    message:
      'Save in now secrets? (this will allow for future deployments without reconfiguring)',
  },
  {
    type: 'confirm',
    name: 'env',
    message: 'Save in env file?',
  },
  {
    type: 'input',
    name: 'secret',
    message:
      'Session secret. If not provided, one will be randomly generated for you (recommended).',
    validate: input => {
      if (input.length > 0 && input.length < 64)
        return 'Must be at least 32 bytes long'
      return true
    },
  },
  {
    type: 'input',
    name: 'filePath',
    when: hash => hash.env,
    message: `Where would you like to save the env file? (${process.cwd()})`,
    default: process.cwd(),
  },
]

const deployQuestions = [
  {
    type: 'input',
    name: 'route',
    message:
      'Route protected by boltwall, i.e. path that requires payment to access will be of form `/api/[ENTRY]`:',
    default: 'protected',
    when: () => !process.env.BOLTWALL_PATH, // only ask if it's not set in the env
  },
  {
    type: 'input',
    name: 'protected',
    message:
      'Protected URL: URL to proxy the request to after a payment has been confirmed (optional. Dummy route provided if none entered):',
    when: () => !process.env.BOLTWALL_PROTECTED_URL, // only ask if it's not set in the env
  },
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
    when: () => !process.env.MIN_AMOUNT, // only ask when not set in env
  },
  {
    type: 'list',
    name: 'type',
    message: 'Normal paywall or hodl? (if unsure pick normal)',
    choices: [
      { name: 'Normal', value: 'normal' },
      { name: 'HODL Invoice', value: 'hodl' },
    ],
    when: () => !process.env.BOLTWALL_HODL,
  },
]

exports.deployQuestions = deployQuestions
exports.secretsQuestions = secretsQuestions

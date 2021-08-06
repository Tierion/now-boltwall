const secretsQuestions = [
  {
    type: 'list',
    name: 'source',
    message: 'How would you like to load your LND connection details?',
    choices: [
      { name: 'BTCPay Server', value: 'btcpay' },
      { name: 'File path or raw values', value: 'raw' },
      { name: 'OpenNode API key', value: 'opennode' },
    ],
  },
  {
    type: 'confirm',
    name: 'vercel',
    message:
      'Save in vercel secrets? (this will allow for future deployments without reconfiguring)',
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
      'Session secret. If not provided, one will be randomly generated for you (recommended):',
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
      'Route protected by boltwall, i.e. path that requires payment to access. Will be of form `/api/[ENTRY]`:',
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
    when: () =>
      process.env.CUSTOM_CONFIGS !== 'false' &&
      (!process.env.TIME_CAVEAT && !process.env.ORIGIN_CAVEAT),
  },
  {
    type: 'list',
    name: 'config',
    when: hash => hash.customConfigs || process.env.CUSTOM_CONFIGS === 'true',
    message:
      'Choose a pre-build configuration for access restrictions (see https://github.com/Tierion/boltwall for more information):',
    choices: [
      { name: 'None', value: false },
      { name: 'TIME_CAVEAT', value: 'time' },
      { name: 'ORIGIN_CAVEAT', value: 'origin' },
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
  {
    type: 'input',
    name: 'origin',
    message:
      'Origin (for CORS policy. Leave blank to allow requests from all origins):',
    when: () => !process.env.BOLTWALL_ORIGIN,
  },
  {
    type: 'input',
    name: 'rate',
    message:
      'What rate should be set in the config? (Usually used for time based caveats which supports values to calculate seconds/satoshi for expiration time):',
    when: () => !process.env.BOLTWALL_RATE,
    validate: input => {
      if (isNaN(input)) return 'Must pass a valid number'
      return true
    },
  },
  {
    type: 'confirm',
    name: 'oauth',
    default: false,
    message:
      'Enable oauth for 3rd-party authentication? (See README for more information: https://github.com/Tierion/boltwall#3rd-party-authentication)',
    when: () => !process.env.BOLTWALL_OAUTH,
  },
]

exports.deployQuestions = deployQuestions
exports.secretsQuestions = secretsQuestions

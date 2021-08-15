const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser')
const path = require('path')
const {
  boltwall,
  TIME_CAVEAT_CONFIGS,
  ORIGIN_CAVEAT_CONFIGS,
} = require('boltwall')
const httpProxy = require('http-proxy')

const apiProxy = httpProxy.createProxyServer()
const app = express()

// retrieve and parse configs from process.env
let configs = {}
const {
  TIME_CAVEAT,
  ORIGIN_CAVEAT,
  MIN_AMOUNT = 10,
  BOLTWALL_HODL,
  BOLTWALL_PATH = 'protected',
  BOLTWALL_PROTECTED_URL,
  BOLTWALL_ORIGIN,
  BOLTWALL_OAUTH,
  BOLTWALL_RATE,
} = process.env

// express middleware
const corsOptions = {
  credentials: true,
  origin: BOLTWALL_ORIGIN || true,
  exposedHeaders: [
    'Origin, X-Requested-With, Content-Type, Accept, WWW-Authenticate, Authorization',
  ],
  allowedHeaders: ['Content-Type', 'Authorization'],
  preflightContinue: true,
  optionsSuccessStatus: 204,
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'PATCH', 'OPTIONS'],
}

app.use(cors(corsOptions))

const boltwallPath = path.join('/api', BOLTWALL_PATH)

app.options(boltwallPath, cors(corsOptions))

// need to return 200 if in pre-flight request
app.use(boltwallPath, (req, res, next) => {
  if (req.method === 'OPTIONS') return res.sendStatus(200)
  next()
})

app.use(bodyParser.urlencoded({ extended: false }))
app.use(bodyParser.json())

if (TIME_CAVEAT === 'true') {
  console.log('Enabling boltwall time caveat config')
  configs = TIME_CAVEAT_CONFIGS
} else if (ORIGIN_CAVEAT === 'true') {
  console.log('Enabling boltwall origin caveat config')
  configs = ORIGIN_CAVEAT_CONFIGS
}

if (MIN_AMOUNT) {
  console.log(`Setting minimum amount for invoices to ${MIN_AMOUNT} satoshis.`)
  configs.minAmount = MIN_AMOUNT
}

if (BOLTWALL_HODL === 'true') {
  console.log('HODL invoices enabled')
  configs.hodl = true
}

if (BOLTWALL_OAUTH === 'true') {
  console.log('3rd party authentication with oauth is enabled')
  configs.oauth = true
}

if (BOLTWALL_RATE && BOLTWALL_RATE > 0) {
  console.log('3rd party authentication with oauth is enabled')
  configs.rate = BOLTWALL_RATE
}

app.use((req, resp, next) => {
  console.log(req.method, req.path)
  next()
})

app.use(boltwall(configs))

let protectedRoute

if (BOLTWALL_PROTECTED_URL) {
  protectedRoute = (req, res) => {
    console.log(
      'Request paid for and authenticated. Forwarding to protected route.'
    )
    console.log(
      `Forwarding request: ${req.method} ${path.join(
        BOLTWALL_PROTECTED_URL,
        req.path
      )}`
    )
    apiProxy.web(req, res, {
      target: BOLTWALL_PROTECTED_URL,
      secure: true,
      xfwd: true, // adds x-forward headers
      changeOrigin: true, // changes the origin of the host header to the target URL. fixes a ssl related error
    })
  }
} else {
  protectedRoute = (req, res) =>
    res.json({
      message:
        'Fallback protected route! This message will only be returned if an invoice has been paid',
    })
}

app.use(boltwallPath, protectedRoute)
app.all('*', (req, res) => res.status(404).send('Resource not found'))

module.exports = app

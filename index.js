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

// middleware
app.use(cors())
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

// allow setting of configs using environment variables
let configs = {}
const {
  TIME_CAVEAT,
  ORIGIN_CAVEAT,
  MIN_AMOUNT = 10,
  BOLTWALL_HODL,
  BOLTWALL_PATH = 'protected',
  BOLTWALL_PROTECTED_URL,
} = process.env

if (TIME_CAVEAT === true) configs = TIME_CAVEAT_CONFIGS
else if (ORIGIN_CAVEAT === true) configs = ORIGIN_CAVEAT_CONFIGS

if (MIN_AMOUNT) configs.minAmount = MIN_AMOUNT

// eslint-disable-next-line no-extra-boolean-cast
if (BOLTWALL_HODL === 'true') configs.hodl = true

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

app.use(path.join('/api', BOLTWALL_PATH), protectedRoute)
app.all('*', (req, res) => res.status(404).send('Resource not found'))

module.exports = app

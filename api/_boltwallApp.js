const express = require('express')
const cors = require('cors')
var bodyParser = require('body-parser')
const {
  boltwall,
  TIME_CAVEAT_CONFIGS,
  ORIGIN_CAVEAT_CONFIGS,
} = require('boltwall')

const app = express()

// middleware
app.use(cors())
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

// allow setting of configs using environment variables
let configs = {}
const { TIME_CAVEAT, ORIGIN_CAVEAT, MIN_AMOUNT, BOLTWALL_HODL } = process.env

if (TIME_CAVEAT === true) configs = TIME_CAVEAT_CONFIGS
else if (ORIGIN_CAVEAT === true) configs = ORIGIN_CAVEAT_CONFIGS

if (MIN_AMOUNT) configs.minAmount = MIN_AMOUNT

if (BOLTWALL_HODL) configs.hodl = true

console.log(
  'TIME_CAVEAT, ORIGIN_CAVEAT, MIN_AMOUNT, BOLTWALL_HODL',
  TIME_CAVEAT,
  ORIGIN_CAVEAT,
  MIN_AMOUNT,
  BOLTWALL_HODL
)
app.use(boltwall(configs))

module.exports = app

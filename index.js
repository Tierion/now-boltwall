const express = require('express')
const cors = require('cors')
var bodyParser = require('body-parser')
const { boltwall, TIME_CAVEAT_CONFIGS } = require('boltwall')

const app = express()

// middleware
app.use(cors())
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }))
// parse application/json
app.use(bodyParser.json())

// optionally disable time caveat. Defaults to enabling time caveat
if (process.env.TIME_CAVEAT === true || process.env.TIME_CAVEAT === undefined)
  app.use(boltwall(TIME_CAVEAT_CONFIGS))
else app.use(boltwall())

module.exports = app

const boltwallApp = require('now-boltwall')

boltwallApp.use(function(req, res) {
  return res.json({
    message:
      'This message is protected and should only be visible when the appropriate invoice has been paid',
  })
})

module.exports = boltwallApp

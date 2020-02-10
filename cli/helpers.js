const { spawnSync } = require('child_process')
const chalk = require('chalk')

function testNow() {
  console.log(chalk.bold('Checking local version of now-cli...'))
  try {
    const nowVersion = spawnSync('now', ['--version'])
    const nowTeam = spawnSync('now', ['whoami'])

    console.log(
      chalk.bgBlue(`Now version: ${nowVersion.stdout.toString()}
Now team: ${nowTeam.stdout.toString()}`)
    )
  } catch (e) {
    throw new Error(
      'now-cli command failed. Make sure it is installed properly and try again. (https://zeit.co/download)'
    )
  }
}

exports.testNow = testNow

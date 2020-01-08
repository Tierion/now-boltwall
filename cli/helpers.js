const { execSync } = require('child_process')
const chalk = require('chalk')

function testNow() {
  console.log(chalk.bold('Checking local version of now-cli...'))
  try {
    const nowVersion = execSync('now --version')
    const nowTeam = execSync('now whoami')
    console.log(
      chalk.bgBlue(`Now version: ${nowVersion}
Now team: ${nowTeam}`)
    )
  } catch (e) {
    throw new Error(
      'now-cli command failed. Make sure it is installed properly and try again. (https://zeit.co/download)'
    )
  }
}

exports.testNow = testNow

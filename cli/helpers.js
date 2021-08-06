const { spawnSync } = require('child_process')
const chalk = require('chalk')

function testNow() {
  console.log(chalk.bold('Checking local version of vercel...'))
  try {
    const nowVersion = spawnSync('vercel', ['--version'])
    const nowTeam = spawnSync('vercel', ['whoami'])

    console.log(
      chalk.bgBlue(`Vercel version: ${nowVersion.stdout.toString()}
Vercel team: ${nowTeam.stdout.toString()}`)
    )
  } catch (e) {
    throw new Error(
      'vercel command failed. Make sure it is installed properly and try again. (https://vercel.com/cli)'
    )
  }
}

exports.testNow = testNow

#!/usr/bin/env node
const program = require('commander')
const pkg = require('../package.json')
const chalk = require('chalk')
const secrets = require('./secrets')
const deploy = require('./deploy')

program.version(pkg.version).description(pkg.description)

program
  .command('secrets')
  .description(
    `Set environment variable secrets for LND connections. Supports 3 connection options:
- BTCPay Server
- File path or raw values (hex or base64)
- OpenNode API Key
`
  )
  .alias('s')
  .action(secrets)

program
  .command('deploy <name>')
  .alias('d')
  .option('-s --secrets', 'Use vercel secrets for configs')
  .option(
    '-e --env [envPath]',
    'Use env vars and .env file (at envPath if set, defaults to current working dir) for configs'
  )
  .description(
    'Deploy an instance using vercel. Pass the name of your project to be used in the deployment url.'
  )
  .action(deploy)

if (!process.argv.slice(2).length) {
  program.outputHelp(text => chalk.red(text))
}

program.parse(process.argv)

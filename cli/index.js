#!/usr/bin/env node

const program = require('commander')
const pkg = require('../package.json')
const chalk = require('chalk')
const secrets = require('./secrets')
const deploy = require('./deploy')

program.version(pkg.version).description(pkg.description)

program
  .command('secrets')
  .description('Set environment variable secrets for LND connections')
  .alias('s')
  .action(secrets)

program
  .command('deploy [name]')
  .alias('d')
  .option('-s --secrets', 'Use now secrets for configs')
  .option(
    '-e --env [envPath]',
    'Use env vars and .env file (at envPath if set) for configs'
  )
  .description(
    'Deploy an instance using now-cli. Pass custom name if not using directory name.'
  )
  .action(deploy)

if (!process.argv.slice(2).length) {
  program.outputHelp(text => chalk.red(text))
}

program.parse(process.argv)

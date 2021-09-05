#!/usr/bin/env node

import osPath from 'path'
import { program } from 'commander'

import { build } from './build'
import { Logger } from './logger'
import { getCurrentPackageVersion } from './version'

// start at current working directory by default
const DEFAULT_START_PATH = osPath.resolve(process.cwd())

program
    .name('squirrel')
    .storeOptionsAsProperties(false)
    .description('Bundle your library with the power of squirrel')
    .option('-p, --path [path]', 'Path to start building', DEFAULT_START_PATH)
    .option('-v, --version', 'Prints version info')
    .option('-c, --tsconfig [config]', 'TypeScript config')

program.parse(process.argv)

program.on('option:version', () => {
    Logger.log(getCurrentPackageVersion())
    process.exit(0)
})

const { path } = program.opts()

build(path).catch((err) => {
    Logger.log(err)
    process.exit(1)
})

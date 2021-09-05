#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var path_1 = __importDefault(require("path"));
var commander_1 = require("commander");
var build_1 = require("./build");
var logger_1 = require("./logger");
var version_1 = require("./version");
// start at current working directory by default
var DEFAULT_START_PATH = path_1.default.resolve(process.cwd());
commander_1.program
    .name('squirrel')
    .storeOptionsAsProperties(false)
    .description('Bundle your library with the power of squirrel')
    .option('-p, --path [path]', 'Path to start building', DEFAULT_START_PATH)
    .option('-v, --version', 'Prints version info')
    .option('-c, --tsconfig [config]', 'TypeScript config');
commander_1.program.parse(process.argv);
commander_1.program.on('option:version', function () {
    logger_1.Logger.log((0, version_1.getCurrentPackageVersion)());
    process.exit(0);
});
var path = commander_1.program.opts().path;
(0, build_1.build)(path).catch(function (err) {
    logger_1.Logger.log(err);
    process.exit(1);
});

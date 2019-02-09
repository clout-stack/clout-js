/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const async = require('async');
const debug = require('debug')('clout:commands');
const prompt = require('prompt');
const utils = require('./utils');

module.exports = function config(clout) {
  const COMMANDS_DIR = path.join(__dirname, 'commands');
  debug('COMMANDS_DIR: %s', COMMANDS_DIR);

  prompt.message = '';
  prompt.delimiter = '';

  const globPattern = `${COMMANDS_DIR}**/*.js`;
  utils.getGlobbedFiles(globPattern).forEach((filePath) => {
    let commandConf = require(filePath),
      command = clout.program.command(commandConf.command).desc(commandConf.desc);

    debug('creating command `%s`: %s', commandConf.command, commandConf.desc);

    // load options
    commandConf.options && commandConf.options.forEach((option) => {
      debug('option: %s', option);
      command.option(...option);
    });
    // we may add custom loaders for command actions
    command.action((argv) => {
      if (commandConf.banner !== false) {
        // print banner
        console.log('\n  %s %s', clout.package.name.cyan, clout.package.version);
        console.log('  %s\n', clout.package.description.grey);
      }
      async.series([
        function ensureMissingOptions(next) {
          const missingOptions = [];
          // check missing options
          commandConf.required && commandConf.required.forEach((required) => {
            const value = argv.param(...typeof required.option === 'string' ? [required.option] : required.option);
            if (!value) {
              missingOptions.push(required);
            }
          });

          if (missingOptions.length === 0) {
            return next();
          }

          // prompt for missing
          prompt.get(missingOptions, (err, result) => {
            if (!result) {
              // probably a SIGKILL
              console.log('');
              return;
            }
            _.merge(argv.params, result);
            next();
          });
          prompt.start();
        },
      ], function (err) {
        if (err) {
          console.error(err.red);
          return;
        }
        this.prompt = prompt;
        commandConf.action.apply(this, [argv]);
      });
    });
  });
};

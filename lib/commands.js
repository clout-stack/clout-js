/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const async = require('async');
const utils = require('./utils');
const debug = require('debug')('clout:commands');
const prompt = require('prompt');

module.exports = function config(clout) {
	var COMMANDS_DIR = path.join(__dirname, 'commands');
	debug('COMMANDS_DIR: %s', COMMANDS_DIR);

	prompt.message = "";
	prompt.delimiter = "";

	var globPattern = COMMANDS_DIR + '**/*.js';
	utils.getGlobbedFiles(globPattern).forEach(function (filePath) {
		var commandConf = require(filePath),
			command = clout.program.command(commandConf.command).desc(commandConf.desc);

		debug('creating command `%s`: %s', commandConf.command, commandConf.desc);

		// load options
		commandConf.options && commandConf.options.forEach(function (option) {
			debug('option: %s', option);
			command.option.apply(command, option);
		});
		// we may add custom loaders for command actions
		command.action(function (argv) {
			if (commandConf.banner !== false) {
				// print banner
				console.log('\n  %s %s', clout.package.name.cyan, clout.package.version);
				console.log('  %s\n', clout.package.description.grey);
			}
			async.series([
				function ensureMissingOptions(next) {
					var missingOptions = [];
					// check missing options
					commandConf.required && commandConf.required.forEach(function (required) {
						var value = argv.param.apply(argv, typeof required.option === 'string' ? [required.option] : required.option);
						if (!value) {
							missingOptions.push(required);
						}
					});

					if (missingOptions.length === 0) {
						return next();
					}

					// prompt for missing
					prompt.get(missingOptions, function (err, result) {
						if (!result) {
							// probably a SIGKILL
							console.log('');
							return;
						}
						_.merge(argv.params, result);
						next();
					});
					prompt.start();
				}
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

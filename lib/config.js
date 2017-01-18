/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const
	path = require('path'),
	fs = require('fs-extra'),
	_ = require('lodash'),
	utils = require('./utils'),
	debug = require('debug')('clout:config');

/**
 * Creates a configuration object
 * @param {Object} defaultConf default configuration
 */
class Config {
	constructor(defaultConf) {
		debug('initializing config');
		this.env = process.env.NODE_ENV || 'development';

		defaultConf && _.merge(this, defaultConf);
	}

	/**
	 * Loads configuration
	 * @param  {Path} dir directory
	 */
	loadFromDir(dir) {
		debug('loading config from dir %s', dir);
		if (!fs.existsSync(dir)) {
			debug('dir does not exist');
			return;
		}

		// load configurations
		var globDefault = '*default.js',
			globEnv = '*' + this.env + '.js';

		// 1) load default configuration
		utils.getGlobbedFiles(path.join(dir, globDefault)).forEach( (file) => {
			debug('loading config from: %s', file);
			_.merge(this, require(file));
		});

		// 2) load env specific configuration
		utils.getGlobbedFiles(path.join(dir, globEnv)).forEach( (file) => {
			debug('loading config from: %s', file);
			_.merge(this, require(file));
		});
	}

	/**
	 * Add config
	 * @param  {...[object]} config configuration object
	 */
	merge(...opts) {
		_.merge(...[this, ...opts]);
	}

	toString() {
		return `[clout config] ${JSON.stringify(this, null, '  ')}`;
	}
}

module.exports = Config;

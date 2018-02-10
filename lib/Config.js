/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
/**
 * @module clout-js/lib/Config
 */
const path = require('path');
const fs = require('fs-extra');
const _ = require('lodash');
const utils = require('./utils');
const debug = require('debug')('clout:config');

/**
 * Creates a configuration object
 * @class
 */
class Config {

	/**
	 * @constructor
	 * @param {object} defaultConf default configuration object
	 */
	constructor(defaultConf) {
		debug('initializing config');
		this.env = process.env.NODE_ENV || 'development';

		if (defaultConf) {
			_.merge(this, defaultConf);
		}
	}

	/**
	 * Loads configuration
	 * @param  {object} dir directory
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
		utils.getGlobbedFiles(path.join(dir, globDefault)).forEach((file) => {
			debug('loading config from: %s', file);
			_.merge(this, require(file));
		});

		// 2) load env specific configuration
		utils.getGlobbedFiles(path.join(dir, globEnv)).forEach((file) => {
			debug('loading config from: %s', file);
			_.merge(this, require(file));
		});
	}

	/**
	 * Add config
	 * @param  {array} config configuration object
	 */
	merge(...opts) {
		_.merge(...[this, ...opts]);
	}

	toString() {
		return `[clout config] ${JSON.stringify(this, null, '  ')}`;
	}
}

module.exports = Config;

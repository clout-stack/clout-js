/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
/**
 * @module clout-js/lib/Logger
 */
const util = require('util');
const path = require('path');

const fs = require('fs-extra');
const debug = require('debug')('clout:logger');
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

/**
 * Clout Logger (Extends winston)
 * @class
 * @extends winston.Logger
 */
class Logger extends winston.Logger {

	/**
	 * @constructor
	 * @param {object} clout clout-js instance
	 */
	constructor(clout) {
		debug('initialize logger');
		super();

		this.clout = clout;
		this.transports = [];

		this.clout.registerHook('start', this.appendToMiddleware, this.clout.CORE_PRIORITY.MIDDLEWARE);

		if (this.clout.config.logToDir === true) {
			this.logToDir();
		}

		// dont log to console in production
		if (clout.config.env !== 'production') {
			this.logToConsole();
		}

		this.saveConfiguration();
	}

	/**
	 * Appends logger to middleware
	 */
	appendToMiddleware(next) {
		this.app.use((req, resp, next) => {
			req.logger = this.logger;
			next();
		});
		next();
	}

	/**
	 * Enables logging to console
	 */
	logToConsole() {
		this.transports.push(new (winston.transports.Console)());
	}

	/**
	 * Enables logging to application directory
	 */
	logToDir() {
		let logDirectory = path.join(this.clout.rootDirectory, 'logs');

		fs.ensureDirSync(logDirectory);
		debug('logDirectory: %s', logDirectory);
		debug('add transport', 'DailyRotateFile');

		let dailyRotateFile = new DailyRotateFile({
			filename: path.join(logDirectory, 'clout_'),
			datePattern: 'yyyy-MM-dd.log'
		});

		this.transports.push(dailyRotateFile);
	}

	/**
	 * Save configuration and update log level
	 * @param  {String} level log level
	 */
	saveConfiguration(level) {
		this.configure({
			level: level || process.env.LOG_LEVEL || 'verbose',
			transports: this.transports
		});
	}
}

module.exports = Logger;

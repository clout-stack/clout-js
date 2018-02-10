/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
/**
 * @module clout-js/lib/Logger
 */
const util = require('util');
const 
	debug = require('debug')('clout:logger'),
	fs = require('fs-extra'),
	path = require('path'),
	winston = require('winston'),
	DailyRotateFile = require('winston-daily-rotate-file');

/**
 * Clout Logger (Extends winston)
 */
function Logger(clout) {
	debug('initialize logger');
	winston.Logger.call(this);
	this.clout = clout;
	this.transports = [];

	clout.registerHook('start', this.appendToMiddleware, this.clout.CORE_PRIORITY.MIDDLEWARE);
	
	(clout.config.logToDir !== false) && this.logToDir();
	// dont log to console in production
	clout.config.env !== 'production' && this.logToConsole();
	this.saveConfiguration();
}
util.inherits(Logger, winston.Logger);

/**
 * Appends logger to middleware
 */
Logger.prototype.appendToMiddleware = function appendToMiddleware(next) {
	var self = this;
	this.app.use(function (req, resp, next) {
		req.logger = self.logger;
		next();
	});
	next();
}

/**
 * Enables logging to console
 */
Logger.prototype.logToConsole = function () {
	this.transports.push(new (winston.transports.Console)());
}

/**
 * Enables logging to application directory
 */
Logger.prototype.logToDir = function logToDir() {
	var logDirectory = path.join(this.clout.rootDirectory, 'logs');
	fs.ensureDirSync(logDirectory);
	debug('logDirectory: %s', logDirectory);
	debug('add transport', 'DailyRotateFile');
	var dailyRotateFile = new DailyRotateFile({
		filename: path.join(logDirectory, 'clout_'),
	    datePattern: 'yyyy-MM-dd.log'
	});
	this.transports.push(dailyRotateFile);
}

/**
 * Save configuration and update log level
 * @param  {String} level log level
 */
Logger.prototype.saveConfiguration = function saveConfiguration(level) {
	this.configure({
	    level: level || process.env.LOG_LEVEL || 'verbose',
	    transports: this.transports
	});
}

module.exports = Logger;

/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
/**
 * Utilities
 * @module clout-js/lib/utils
 */
const _ = require('lodash');
const glob = require('glob');

var utils = module.exports = {};

/**
 * get globbed files
 * @param  {string|array} globPatterns glob pattern
 * @return {array}  files 	array of files matching glob
 */
utils.getGlobbedFiles = function getGlobbedFiles(globPatterns) {
	var self = this,
		output = [];
	if (_.isArray(globPatterns)) {
		globPatterns.forEach(function (globPattern) {
			output = _.union(output, self.getGlobbedFiles(globPattern, toRemove));
		});
	} else if (_.isString(globPatterns)) {
		var files = glob(globPatterns, {
			sync: true
		});
		output = _.union(output, files);
	}
	return output;
};

/**
 * Get value from object using string
 * @param  {string} key string representing path
 * @param  {object} obj Object to travel
 * @return {object}     value
 * @example
 * let config = { mysql: { database: 'testdb' } };
 * utils.getValue('mysql.database', config) // testdb
 * utils.getValue('mysql', config).database = 'newdb' // newdb
 */
utils.getValue = function getValue(keyString, obj) {
	let nodes = keyString.split('.');
	let key = obj;

	do {
		let node = nodes.shift(); // whos the lucky node?
		let hasNode = key && key.hasOwnProperty(node);

		if (hasNode) {
			key = key[node]; // traval
			continue;
		}

		nodes = []; // derefference nodes
		key = undefined; // nothing found :(
	} while (nodes.length > 0);

	return key;
};

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

const isInTranspiler = typeof module._compile === 'function';

const utils = module.exports = {};

utils.expandGlobPatterns = (globPatterns) => {
	if (!isInTranspiler) {
		return globPatterns;
	}

	return globPatterns.reduce((acc, globPattern) => {
		acc.push(globPattern);

		if (globPattern.includes('.js')) {
			const tsPattern = globPattern.replace('.js', '.ts');
			acc.push(tsPattern);
		}

		return acc;
	}, [])
}

/**
 * get globbed files
 * @param  {string|array} globPatterns glob pattern
 * @return {array}  files 	array of files matching glob
 */
utils.getGlobbedFiles = function getGlobbedFiles(globPatterns) {
	const patterns = _.isArray(globPatterns) ? globPatterns : [globPatterns];
	const expandedPatterns = utils.expandGlobPatterns(patterns);

	return expandedPatterns.reduce((acc, globPattern) => [...acc, ...glob(globPattern, {sync: true})], [])
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

utils.safePromisifyCallFn = (fn, context, [req, resp, done, ...args]) => {
	return new Promise((resolve, reject) => {
		const done = (err, data) => err ? reject(err) : resolve(data);
		const maybePromise = fn.apply(context, [req, resp, done, ...args])

		if (maybePromise && maybePromise.then) {
			maybePromise
				.then(data => resolve(data))
				.catch(err => reject(err));
		}
	})
}

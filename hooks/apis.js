/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
/**
 * @module clout-js/hooks/apis
 */
const debug = require('debug')('clout:hook/apis');
const path = require('path');
const utils = require('../lib/utils');
const express = require('express');

const ACCEPT_TYPES = {
	json: 'application/json',
	html: 'text/html'
};

const API_BASE_PATH = '/api';

let apiRoutes;

/**
 * Load APIs from a file
 * @private
 * @param {string} filePath
 * @param {object} router express router
 */
function loadAPIFromFile(filePath, router) {
	let groupName = path.basename(filePath).replace('.js', '');

	if (!apiRoutes[groupName]) {
		apiRoutes[groupName] = [];
	}

	debug('loading apis from %s', groupName);
	try {
		var apis = require(filePath);
	} catch (e) {
		throw new Error(`Error loading api groupName '${groupName}'\n${e}`);
	}
	Object.keys(apis).forEach(function loadApi(apiName) {
		debug('loading api %s:%s', groupName, apiName);
		let api = apis[apiName];
		let apiMeta;

		if (!api.path) {
			return;
		}

		// allow .ext
		let apiPath = `\${api.path}.:acceptType?`;

		var hooks = api.hooks || [],
			methods = api.methods
				? api.methods
				: [api.method || 'all'];

		methods = methods.map((method) => method.toLowerCase());

		// log endpoint request
		methods.forEach((method) => router[method](apiPath, function (req, res, next) {
			req.logger.info('Endpoint [%s] /api%s', req.method, req.path);
			debug('Endpoint [%s] /api%s', req.method, req.path);
			next();
		}));

		// load hook first
		hooks.forEach(function (hook) {
			if (typeof hook === 'string') {
				// implement smart hooks
				return;
			}
			methods.forEach((method) => router[method](apiPath, function (req) {
				hook.name && debug('hook:', hook.name);
				hook.apply(this, arguments);
			}));
		});

		// load api
		if (api.fn) {
			methods.forEach((method) => router[method](apiPath, function (req) {
				debug('loaded endpoint [%s] /api%s', method, apiPath);
				// allow .ext
				if (req.params.acceptType && ACCEPT_TYPES[req.params.acceptType]) {
					var acceptType = ACCEPT_TYPES[req.params.acceptType];
					debug('acceptType', acceptType);
					req.headers['accept'] = acceptType + ',' + req.headers['accept'];
				};
				debug('loading api %s:%s', groupName, apiName);
				api.fn.apply(this, arguments);
			}));

			apiMeta = {
				path: `${API_BASE_PATH}${api.path}`,
				methods: methods,
				params: api.params || {},
				description: api.description
			};

			apiRoutes[groupName].push(apiMeta);
		}
	});
}

/**
 * Finds all the .js Files inside a directory and loads it
 * @private
 * @param {string} dir directory containing APIs
 * @param {object} router express router
 */
function loadAPIsFromDirectory(dir, router) {
	var dirs = utils.getGlobbedFiles(path.join(dir, '**/**.js'));
	dirs.forEach((filePath) => loadAPIFromFile(filePath, router));
}

module.exports = {
	/**
	 * initialize apis from application paths
	 * @property {event} event start
	 * @property {priority} priority API
	 */
	initialize: {
		event: 'start',
		priority: 'API',
		fn: function (next) {
			let router = express.Router();

			apiRoutes = this.apiRoutes = {};

			debug('loading apis');
			// 1) load module hooks
			this.modules.forEach((moduleInfo) => {
				loadAPIsFromDirectory(path.resolve(moduleInfo.path, 'apis'), router);
			});
			// 2) load application hooks
			loadAPIsFromDirectory(path.resolve(this.rootDirectory, 'apis'), router);

			// 3) attach router
			this.app.use(API_BASE_PATH, router);

			debug('attached router');
			next();
		}
	}
};

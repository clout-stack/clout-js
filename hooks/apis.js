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

const {merge} = require('lodash');

class CloutApiRoute {
	constructor(_opts) {
		this._opts = _opts;

		this.path = this._opts.path;
		this.hooks = this._opts.hooks || [];
		this.methods = (this._opts.methods || [this._opts.method]).map((method) => method.toLowerCase());

		this.group = this._opts.group;
		this.name = this._opts.name;
		this.description = this._opts.description;
		this.params = this._opts.params; // do something with this maybe

		this.fn = this._opts.fn;
	}

	attachRouter(router) {
		this.router = router;

		return this.methods.forEach((method) => {
			// it's an endpoint
			if (this.path) {
				let path = `${this.path}.:acceptType?`;

				// attach logging
				this.router[method](path, function (req, resp, next) {
					req.logger.info('Endpoint [%s] /api%s', req.method, req.path);
					next();
				});

				// attach hooks
				this.hooks.map((hook) => this.router[method](path, hook));

				// execute fn
				if (this.fn) {
					this.router[method](path, this.fn);
				}
			}
			
		});
	}
}

class CloutApiRoutes {
	constructor(app) {
		this.clout = app;
		this.config = {
			basePath: '/api',
			acceptTypes: {
				json: 'application/json',
				html: 'text/html'
			}
		};
		this.routes = {};
		this.router = express.Router();
		this.handleAcceptTypeParams();

		this.clout.logger.debug('Module CloutApiRoutes loaded');
	}

	handleAcceptTypeParams() {
		this.router.param('acceptType', (req, resp, next, type) => {
			let acceptType = this.config.acceptTypes[type];

			req.logger.info(`handling param '${acceptType}'`);

			if (acceptType) {
				req.headers['accept'] = `${acceptType},` + req.headers['accept'];
			};

			next();
		});
	}

	attachRouter() {
		let basePath = this.config.basePath;

		this.clout.app.use(basePath, this.router);
		this.clout.logger.debug(`router attached at ${basePath}`);
	}

	addRoute(cloutRoute) {
		if (!this.routes[cloutRoute.group]) {
			this.routes[cloutRoute.group] = [];
		}

		this.routes[cloutRoute.group].push(cloutRoute);

		cloutRoute.attachRouter(this.router);
	}

	/**
	 * Load APIs from a file
	 * @private
	 * @param {string} filePath
	 * @param {object} router express router
	 */
	loadAPIFromFile(filePath) {
		let groupName = path.basename(filePath).replace('.js', '');
		let apis = require(filePath);

		this.clout.logger.debug(`loading API from file ${filePath}`);

		return Object.keys(apis).map((apiName) => {
			let opts = merge({
				method: 'all',
				name: apiName,
				group: groupName
			}, apis[apiName]);

			return this.addRoute(new CloutApiRoute(opts));
		});
	}

	/**
	 * Finds all the **.js files inside a directory and loads it
	 * @param {string} dir path containing directory of APIs
	 */
	loadAPIsFromDir(dir) {
		let globbedDirs = utils.getGlobbedFiles(path.join(dir, '**/**.js'));

		return globbedDirs.map((filePath) => this.loadAPIFromFile(filePath));
	}

	/**
	 * Finds all the **.js files inside an array of directories and loads it
	 * @param {array} dirs array of paths containing directory of APIs
	 */
	loadAPIsFromDirs(dirs) {
		return dirs.map((dir) => this.loadAPIsFromDir(dir));
	}
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
			let clientApiFolder = path.resolve(this.rootDirectory, 'apis');
			let apiDirs = this.modules
				.map((moduleInfo) => path.resolve(moduleInfo.path, 'apis'))
				.concat([clientApiFolder]);

			if (!this.core) {
				this.core = {};
			}

			this.core.api = new CloutApiRoutes(this);

			this.core.api.loadAPIsFromDirs(apiDirs);

			this.core.api.attachRouter();

			next();
		}
	}
};

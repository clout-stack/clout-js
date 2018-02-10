/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
/**
 * Controllers hooks
 * @module clout-js/hooks/controllers
 */
const path = require('path');
const debug = require('debug')('clout:hook/controllers');
const utils = require('../lib/utils');
const express = require('express');
const router = express.Router();
const async = require('async');
const Q = require('q');

module.exports = {
	/**
	 * initialize controllers from application paths
	 * @property {event} event start
	 * @property {priority} priority CONTROLLER
	 */
	initialize: {
		event: 'start',
		priority: 'CONTROLLER',
		fn: function (next) {
			var self = this;
			try {
			function loadController(dir) {
				var name = dir.split('controllers/')[1].replace('.js', '');
				debug('loading controller %s', name);
				var controller = require(dir);

				if (!controller.path) { return; }
				var hooks = controller.hooks || [],
					method = controller.method ? controller.method.toLowerCase() : 'all';

				// log endpoint request
				router[method](controller.path, function (req, res, next) {
					req.logger.info('Endpoint [%s] %s', req.method, req.path);
					debug('Endpoint [%s] %s', req.method, req.path);
					next();
				});

				// load hook first
				hooks.forEach(function (hook) {
					router[method](controller.path, function (req) {
						hook.name && debug('hook:', hook.name);
						hook.apply(this, arguments);
					}); 
				});

				// load controller
				if (controller.fn) {
					debug('loaded endpoint [%s] %s', method, controller.path);
					router[method](controller.path, function (req) {
						debug('loading controller %s:%s', name);
						controller.fn.apply(this, arguments);
					});
				}
			}

			function loadControllersFromDirectory(dir) {
				var deferred = Q.defer(),
					dirs = utils.getGlobbedFiles(path.join(dir, '**/**.js'));
				dirs.forEach(loadController);
				deferred.resolve();
				return deferred.promise;
			}

			debug('loading controllers');
			// 1) load module controllers
			async.each(this.modules, function (module, next) {
				loadControllersFromDirectory(path.join(module.path, 'controllers')).then(function () {
					next(null);
				}, next);
			}, function done(err) {
				if (err) { throw new Error(err); }
				// 2) load application controllers
				loadControllersFromDirectory(path.join(self.rootDirectory, 'controllers')).then(function () {
					debug('attached router');
					self.app.use('/', router);
					next();
				}, next);
			});
		}catch(e) {console.log(e);}
		}
	}
};

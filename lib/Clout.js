/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
/**
 * Clout
 * @module clout-js/lib/Clout
 */
const path = require('path');
const fs = require('fs-extra');
const EventEmitter = require('events').EventEmitter;
const util = require('util');

const debug = require('debug')('clout:core');
const async = require('async');
const _ = require('lodash');

const utils = require('./utils');
const Logger = require('./Logger');
const Config = require('./Config');

/**
 * Priority for core hooks
 * @typedef {(number|string)} priority
 * @property {number} CONFIG 5
 * @property {number} MIDDLEWARE 10
 * @property {number} MODEL 15
 * @property {number} API 20
 * @property {number} CONTROLLER 25
 * @const
 */
const CORE_PRIORITY = {
	CONFIG: 5,
	MIDDLEWARE: 10,
	MODEL: 15,
	API: 20,
	CONTROLLER: 25
};

const CLOUT_MODULE_PATH = path.join(__dirname, '..');

process.on('unhandledRejection', (err) => {
	console.log(err);
    process.exit(1);
});

process.on('uncaughtException', (err) => {
	console.log(err);
    process.exit(1);
});

/**
 * Clout application
 * @class
 */
class Clout extends EventEmitter {
	/**
	 * @constructor
	 * @param {path} rootDirectory application directory
	 */
	constructor(rootDirectory) {
		super();

		this.rootDirectory = null;
		this.package = {};
		this.applicationPackage = {};
		this.config = {};
		this.logger = null;
		this.app = null;
		this.server = {};
		this.modules = [];
		this.moduleCache = [];

		// expose core libraries
		this.utils = utils;
		this.async = async;
		this._ = _;
		this.fs = fs;

		// allow application hooks (Synchronous)
		this.CORE_PRIORITY = CORE_PRIORITY;
		this.hooks = {
			start: [],
			stop: [],
			reload: []
		};

		// Load clout configuration
		this.config = new Config();
		this.config.loadFromDir(path.join(__dirname, '../resources/conf'));

		this.applicationPackage = {};

		// load clout package.json
		this.package = require(path.join(__dirname, '../package.json'));

		// load clout modules
		if (this.package.modules) {
			this.addModules(this.package.modules);
		}

		if (rootDirectory) {
			// set application root directory
			this.rootDirectory = path.resolve(rootDirectory);

			// load application manifest
			['package.json', 'clout.json'].forEach((fileName) => {
				let filePath = path.resolve(this.rootDirectory, fileName);
				if (!fs.existsSync(filePath)) {
					return debug(`${fileName} not found`);
				}

				_.merge(this.applicationPackage, require(filePath));
			});

			process.title = `[clout-js v${this.package.version}] ${this.applicationPackage.name}`;

			// load modules from application manifest
			if (this.applicationPackage.modules) {
				this.addModules(this.applicationPackage.modules);
			}
		}

		// append module configuration
		this.modules.forEach((module) => this.config.loadFromDir(path.join(module.path, 'conf')));

		// append application configuration (Overrides module conf)
		this.config.loadFromDir(path.join(this.rootDirectory, 'conf'));

		// initialize logger
		this.logger = new Logger(this);

		// 1) load core hooks
		// 2) load application hooks
		// 3) load module hooks
		this.loadHooksFromDir(CLOUT_MODULE_PATH)
			.then(this.loadHooksFromDir(this.rootDirectory))
			.then(() => {
				return new Promise((resolve, reject) => {
					async.each(this.modules, (module, next) => {
						this.loadHooksFromDir(module.path)
							.catch((err) => console.error(err))
							.finally(() => next());
					}, (err) => {
						if (err) { return reject(err); }
						resolve();
					});
				});
			})
			.catch((err) => console.error(err));
	}

	/**
	 * hook into clout runtime
	 * @param {string}   	event 		event name
	 * @param {Function} 	fn    		function to execute
	 * @param {String} 		fn._name    	hook name
	 * @param {String} 		fn.group    hook group
	 * @param {Number}		priority	function priority
	 * @param {Boolean}		override	override existing
	 * @example
	 * // register a function to the hook
	 * clout.registerHook('start', function (next) {
	 * 	next();
	 * });
	 * // invoking an error in clout runtime
	 * clout.registerHook('start', function (next) {
	 * 	next(new Error('Error executing function'));
	 * });
	 */
	registerHook(event, fn, priority, override) {
		debug('registerHook:event=%s:fn:priority=%s', event, priority);
		if (!this.hooks.hasOwnProperty(event)) {
			throw new Error('Invalid Hook Event');
		}

		typeof priority !== 'undefined' && (fn.priority = priority);

		// find existing, override
		if (override === true) {	
			debug('override');
			for (var i = 0, l = this.hooks[event].length; i < l; ++i) {
				var hook = this.hooks[event][i];
				if (hook._name !== null && hook._name === fn._name && hook.group === fn.group) {
					debug('match found, overriden');
					this.hooks[event][i] = fn;
					return;
				}
			}
		}

		// push is no priority
		if (!fn.priority) {
			debug('push hook (no priority)');
			return this.hooks[event].push(fn);
		}

		// find the correct place to register hook
		for (var i = 0, l = this.hooks[event].length; i < l; ++i) {
			var tmp_p = this.hooks[event][i].priority || 99999;
			if (fn.priority < tmp_p) {
				debug('push hook at index %s', String(i));
				return this.hooks[event].splice(i, 0, fn);
			}
		}
		debug('push hook (lowest priority yet)');
		return this.hooks[event].push(fn);
	}

	/**
	 * Loads hooks from directory
	 * @param  {Path} dir directory
	 * @return {Promise}  promise 
	 */
	loadHooksFromDir(dir) {
		var glob = path.join(dir, '/hooks/**/*.js'),
			files = utils.getGlobbedFiles(glob);

		debug('loadHooksFromDir: %s', dir);

		return new Promise((resolve, reject) => {
			async.each(files, (file, next) => {
				var hooks = require(file);
				debug('loading hooks from file: %s', String(file));
				var keys = Object.keys(hooks);
				keys.forEach((key) => {
					debug('Loading hook: %s', key);
					var hook = hooks[key],
						args = [];
					// create args
					if (!hook.event || !hook.fn) {
						throw new Error('Hook missing attributes');
					}
					hook.fn.group = file.split('hooks/')[1].replace('.js', '');
					hook.fn._name = key;
					args.push(hook.event);
					args.push(hook.fn);
					if (typeof hook.priority !== 'undefined') {
						if (typeof hook.priority === 'string') {
							if (!this.CORE_PRIORITY.hasOwnProperty(hook.priority)) {
								throw "Invalid priority type";
							}
							hook.priority = this.CORE_PRIORITY[hook.priority];
						}
						args.push(hook.priority);
					} else {
						args.push(null);
					}
					if (hook.override) {
						args.push(true);
					}
					this.registerHook.apply(this, args);
				});
				next();
			}, function done(err) {
				if (err) {
					debug(err);
					return reject(err);
				}
				debug('all hooks loaded from %s', dir);
				resolve();
			});
		});
	}

	addModules(modules) {
		debug('loading modules', JSON.stringify(modules));
		modules.forEach((moduleName) => this.addModule(moduleName));
	}

	/**
	 * Load clout-js node module
	 * @param {string} moduleName clout node module name
	 */
	addModule(moduleName) {
		if (!!~this.moduleCache.indexOf(moduleName)) {
			debug('module: %s already loaded', moduleName);
			return;
		}

		debug('loading module: %s', moduleName);
		this.moduleCache.push(moduleName);

		let cloutModule = {
			name: moduleName,
			path: path.dirname(require.resolve(moduleName)),
			manifest: {}
		};

		this.modules.push(cloutModule);
		debug(cloutModule);

		// load module manifest
		['package.json', 'clout.json'].forEach((fileName) => {
			let filePath = path.resolve(cloutModule.path, fileName);
			if (!fs.existsSync(filePath)) {
				return debug(`${fileName} not found`);
			}

			_.merge(cloutModule.manifest, require(filePath));
		});

		// load module modules
		if (cloutModule.manifest.modules) {
			debug('%s loading modules %s', moduleName, manifest.modules);
			this.addModules(manifest.modules);
		}
	}

	/**
	 * Start clout
	 * @return {Promise} returns a promise
	 */
	start() {
		this.emit('start');
		
		return new Promise((resolve, reject) => {
			process.nextTick(() => {
				async.eachLimit(this.hooks.start, 1, function (hook, next) {
					try {
						debug('executing', hook.name || hook._name, hook.group);
						let hookResponse = hook.apply(this, [next]);

						// support promises
						if (typeof hookResponse === 'object') {
							hookResponse.then(next, (err) => next(null, err));
						}
					} catch (e) { console.error(e); }
				}, (err) => {
					if (err) {
						debug(err);
						return reject(err);
					}
					resolve();
					this.emit('started');
				});
			});
		});
	}

	// TODO:- investigate if we still need this?
	/**
	 * Add API
	 * @param {string} path api path
	 * @param {function} fn express function
	 */
	addApi(path, fn) {
		this.app.use(path, function (req, resp, next) {
			let promiseResponse = fn.apply(this, arguments);

			// support for prmises
			// bind to app.use
			if (String(promiseResponse) === '[object Promise]') {
				promiseResponse
					.then((payload) => {
						switch (Object.prototype.toString.call(payload)) {
							case '[object Object]':
							case '[object String]':
								resp.success(payload);
							break;
							case '[object Undefined]':
							break;
							default:
								console.error('type not supported');
								resp.error('response type is invalid');
							break;
						}
						next();
					})
					.catch((payload) => {
						switch (Object.prototype.toString.call(payload)) {
							case '[object Object]':
							case '[object String]':
								resp.error(payload);
							break;
							case '[object Undefined]':
							break;
							default:
								console.error('type not supported');
								resp.error('response type is invalid');
							break;
						}
						next();
					});
			}
		});

		return new Promise.resolve();
	}

	/**
	 * Stop clout
	 * @return {Promise} returns a promise
	 */
	stop() {
		this.emit('stop');
		return new Promise((resolve, reject) => {
			async.eachLimit(this.hooks.stop, 1, (hook, next) => {
				hook.apply(this, [next]);
			}, (err) => {
				if (err) {
					debug(err);
					return reject(err);
				}

				resolve();
				this.emit('stopped');
			});
		});
	}

	/**
	 * Reload clout
	 * @return {Promise} returns a promise
	 */
	reload() {
		this.emit('reload');

		return this.stop()
			.then(this.start)
			.then(() => {
				deferred.resolve();
				this.emit('reloaded');
			});
	}
}

module.exports = Clout;
module.exports.PRIORITY = CORE_PRIORITY;

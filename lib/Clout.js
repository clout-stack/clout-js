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
const { EventEmitter } = require('events');

const debug = require('debug')('clout:core');
const async = require('async');
const _ = require('lodash');

const utils = require('./utils');
const Logger = require('./Logger');
const Config = require('./Config');
const CloutApiRoute = require('../hookslib/CloutApiRoute');

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
  CONTROLLER: 25,
};

const CLOUT_MODULE_PATH = path.join(__dirname, '..');

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
    this.process = process;
    this.handleProcess();

    this.rootDirectory = null;
    this.package = {};
    this.applicationPackage = {};
    this.config = {};
    this.logger = { debug };
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
      reload: [],
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
        const filePath = path.resolve(this.rootDirectory, fileName);
        if (!fs.existsSync(filePath)) {
          return debug(`${fileName} not found`);
        }

        return _.merge(this.applicationPackage, require(filePath));
      });

      this.process.title = `[clout-js v${this.package.version}] ${this.applicationPackage.name}`;

      // add rootdir to node_modules
      module.paths.unshift(path.join(this.rootDirectory, 'node_modules'));

      // load modules from application manifest
      if (this.applicationPackage.modules) {
        this.addModules(this.applicationPackage.modules);
      }
    }

    // append module configuration
    this.modules.forEach(module => this.config.loadFromDir(path.join(module.path, 'conf')));

    // append application configuration (Overrides module conf)
    this.config.loadFromDir(path.join(this.rootDirectory, 'conf'));

    // initialize logger
    this.logger = new Logger(this);

    // 1) load core hooks
    // 2) load application hooks
    // 3) load module hooks
    this.loadHooksFromDir(CLOUT_MODULE_PATH)
      .then(this.loadHooksFromDir(this.rootDirectory))
      .then(async () => this.modules.map(async module => this.loadHooksFromDir(module.path)))
      .then((moduleHooks) => {
        this.initialized = true;
        return moduleHooks;
      })
      .catch(err => console.error(err));
  }

  /**
   * hook into clout runtime
   * @param {string} event event name
   * @param {Function} fn function to execute
   * @param {String} fn._name hook name
   * @param {String} fn.group hook group
   * @param {Number} priority function priority
   * @param {Boolean} override override existing
   * @example
   * // register a function to the hook
   * clout.registerHook('start', function (next) {
   *  next();
   * });
   * // invoking an error in clout runtime
   * clout.registerHook('start', function (next) {
   *  next(new Error('Error executing function'));
   * });
   */
  registerHook(event, fn, priority, override) {
    const hasPriority = typeof priority !== 'undefined';
    const hasEvent = this.hooks[event];
    debug('registerHook:event=%s:fn:priority=%s', event, hasEvent, priority);

    if (!hasEvent) {
      throw new Error('Invalid Hook Event');
    }

    if (hasPriority) {
      fn.priority = priority;
    }

    // find existing, override
    if (override === true) {
      debug('override');
      for (let i = 0, l = this.hooks[event].length; i < l; i += 1) {
        const hook = this.hooks[event][i];
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
      this.hooks[event].push(fn);
      return;
    }

    // find the correct place to register hook
    for (let i = 0, l = this.hooks[event].length; i < l; i += 1) {
      const tmpPriority = this.hooks[event][i].priority || 99999;

      if (fn.priority < tmpPriority) {
        debug('push hook at index %s', String(i));
        this.hooks[event].splice(i, 0, fn);
        return;
      }
    }

    debug('push hook (lowest priority yet)');
    this.hooks[event].push(fn);
  }

  /**
   * Loads hooks from directory
   * @param  {Path} dir directory
   * @return {Promise}  promise
   */
  loadHooksFromDir(dir) {
    const glob = path.join(dir, '/hooks/**/*.js');
    const files = utils.getGlobbedFiles(glob);

    debug('loadHooksFromDir: %s', dir);

    return new Promise((resolve, reject) => {
      async.each(files, (file, next) => {
        debug('loading hooks from file: %s', String(file));

        const hooks = require(file);
        const keys = Object.keys(hooks);

        keys.forEach((key) => {
          const hook = hooks[key];
          const args = [];

          debug('Loading hook: %s', key);

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
              if (!this.CORE_PRIORITY[hook.priority]) {
                throw new Error('Invalid priority type');
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

          this.registerHook(...args);
        });
        next();
      }, (err) => {
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
    modules.forEach(moduleName => this.addModule(moduleName));
  }

  /**
   * Load clout-js node module
   * @param {string} moduleName clout node module name
   */
  addModule(moduleName) {
    if (this.moduleCache.includes(moduleName)) {
      debug('module: %s already loaded', moduleName);
      return;
    }

    this.logger.debug('loading module: %s', moduleName);
    this.moduleCache.push(moduleName);

    const cloutModule = {
      name: moduleName,
      path: path.dirname(require.resolve(moduleName)),
      manifest: {},
    };

    this.modules.push(cloutModule);
    debug(cloutModule);

    // load module manifest
    ['package.json', 'clout.json'].forEach((fileName) => {
      const filePath = path.resolve(cloutModule.path, fileName);
      if (!fs.existsSync(filePath)) {
        return debug(`${fileName} not found`);
      }

      _.merge(cloutModule.manifest, require(filePath));
    });

    // load module modules
    if (cloutModule.manifest.modules) {
      debug('%s loading modules %s', moduleName, cloutModule.manifest.modules);
      this.addModules(cloutModule.manifest.modules);
    }
  }

  /**
   * Start clout
   * @return {Promise} returns a promise
   */
  start() {
    this.emit('initialized');

    if (!this.initialized) {
      return new Promise((resolve) => {
        setTimeout(() => resolve(this.start()), 100);
      });
    }

    this.emit('start');

    return new Promise((resolve, reject) => {
      process.nextTick(() => {
        async.eachLimit(this.hooks.start, 1, (hook, next) => {
          debug('executing', hook.name || hook._name, hook.group);
          const hookResponse = hook.apply(this, [next]);

          // support promises
          if (typeof hookResponse === 'object') {
            hookResponse.then(next, err => next(null, err));
          }
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
  addApi(apiPath, fn) {
    if (this.core.api) {
      this.core.addRoute(new CloutApiRoute({
        path: apiPath,
        fn,
      }));
    }
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
      .then(() => this.emit('reloaded'));
  }

  handleProcess() {
    this.process.on('unhandledRejection', err => console.error(err));
    this.process.on('uncaughtException', (err) => {
      console.error(err);
      process.exit(0);
    });
  }
}

module.exports = Clout;
module.exports.PRIORITY = CORE_PRIORITY;

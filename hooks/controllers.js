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
const express = require('express');

const router = express.Router();
const async = require('async');
const utils = require('../lib/utils');

module.exports = {
  /**
   * initialize controllers from application paths
   * @property {event} event start
   * @property {priority} priority CONTROLLER
   */
  initialize: {
    event: 'start',
    priority: 'CONTROLLER',
    fn(next) {
      const self = this;

      function loadController(dir) {
        const name = dir.split('controllers/')[1].replace('.js', '');
        debug('loading controller %s', name);
        const controller = require(dir);

        if (!controller.path) { return; }

        const hooks = controller.hooks || [];
        const method = controller.method ? controller.method.toLowerCase() : 'all';

        // log endpoint request
        router[method](controller.path, (req, res, done) => {
          req.logger.info('Endpoint [%s] %s', req.method, req.path);
          debug('Endpoint [%s] %s', req.method, req.path);
          done();
        });

        // load hook first
        hooks.forEach((hook) => {
          router[method](controller.path, function cloutHook(...args) {
            if (hook.name) {
              debug('hook:', hook.name);
            }

            hook.apply(this, args);
          });
        });

        // load controller
        if (controller.fn) {
          debug('loaded endpoint [%s] %s', method, controller.path);
          router[method](controller.path, function cloutController(...args) {
            debug('loading controller %s:%s', name);
            controller.fn.apply(this, args);
          });
        }
      }

      function loadControllersFromDirectory(dir) {
        const dirs = utils.getGlobbedFiles(path.join(dir, '**/**.js'));
        dirs.forEach(loadController);
        return Promise.resolve();
      }

      try {
        debug('loading controllers');
        // 1) load module controllers
        async.each(this.modules, (module, done) => {
          loadControllersFromDirectory(path.join(module.path, 'controllers'))
            .then(() => done())
            .catch(err => done(err));
        }, (err) => {
          if (err) { throw new Error(err); }
          // 2) load application controllers
          loadControllersFromDirectory(path.join(self.rootDirectory, 'controllers')).then(() => {
            debug('attached router');
            self.app.use('/', router);
            next();
          }, next);
        });
      } catch (e) {
        console.error(e);
      }
    },
  },
};

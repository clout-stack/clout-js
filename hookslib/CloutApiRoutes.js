/*!
 * clout-js
 * Copyright(c) 2018 Muhammad Dadu
 * MIT Licensed
 */

const { merge } = require('lodash');
const express = require('express');
const path = require('path');
const CloutApiRoute = require('../hookslib/CloutApiRoute');
const utils = require('../lib/utils');

const PRIORITIZED_FILES = ['index.js', 'clout.hook.js'];

/**
 * CloutApiRoutes
 * @class
 */
class CloutApiRoutes {
  /**
     * @constructor
     * @param {object} app clout instance
     */
  constructor(app) {
    this.clout = app;
    this.config = {
      basePath: '/api',
      acceptTypes: {
        json: 'application/json',
        html: 'text/html',
      },
    };
    this.routes = {};
    this.router = express.Router();
    this.initializeAcceptTypeHandler();

    this.clout.logger.debug('Module CloutApiRoutes loaded');
  }

  /**
     * Clout-JS handler for custom content requests
     */
  initializeAcceptTypeHandler() {
    this.router.param('acceptType', (req, resp, next, type) => {
      const acceptType = this.config.acceptTypes[type];

      req.logger.info(`handling param '${acceptType}'`);

      if (acceptType) {
        req.headers.accept = `${acceptType},${req.headers.accept}`;
      }

      next();
    });
  }

  /**
     * Attaches router to clout-app
     */
  attachRouterToApp() {
    const basePath = this.config.basePath;

    this.clout.app.use(basePath, this.router);
    this.clout.logger.debug(`router attached at ${basePath}`);
  }

  /**
     * Add CloutApiRouter to router
     * @param {object} CloutApiRouter
     */
  addRoute(cloutRoute) {
    if (!this.routes[cloutRoute.group]) {
      this.routes[cloutRoute.group] = [];
    }

    this.routes[cloutRoute.group].push(cloutRoute);

    cloutRoute.attachRouter(this.router);
  }

  /**
   * Load APIs from a file
   * @param {string} filePath
   */
  loadAPIFromFile(filePath) {
    const groupName = path.basename(filePath).replace('.js', '');
    const apis = require(filePath);

    this.clout.logger.debug(`loading API from file ${filePath}`);

    return Object.keys(apis).map((apiName) => {
      const opts = merge({
        name: apiName,
        group: groupName,
      }, apis[apiName]);

      return this.addRoute(new CloutApiRoute(opts));
    });
  }

  /**
   * Finds all the **.js files inside a directory and loads it
   * @param {string} dir path containing directory of APIs
   */
  loadAPIsFromDir(dir) {
    const globbedDirs = utils.getGlobbedFiles(path.join(dir, '**/**.js'));

    return globbedDirs.sort((a, b) => {
      const aPriority = PRIORITIZED_FILES.indexOf(a) !== -1;
      const bPriority = PRIORITIZED_FILES.indexOf(b) !== -1;
      const weight = { a: 0, b: 0 };

      if (aPriority !== -1) {
        weight.a = aPriority + 1;
      }
      if (bPriority !== -1) {
        weight.b = aPriority + 1;
      }

      return weight.a > weight.b ? 1 : weight.b > weight.a ? -1 : 0;
    }).map(filePath => this.loadAPIFromFile(filePath));
  }

  /**
   * Finds all the **.js files inside an array of directories and loads it
   * @param {array} dirs array of paths containing directory of APIs
   */
  loadAPIsFromDirs(dirs) {
    return dirs.map(dir => this.loadAPIsFromDir(dir));
  }
}

module.exports = CloutApiRoutes;

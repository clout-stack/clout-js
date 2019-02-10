/*!
 * clout-js
 * Copyright(c) 2018 Muhammad Dadu
 * MIT Licensed
 */

const { merge } = require('lodash');
const express = require('express');
const path = require('path');
const CloutApiRoute = require('./CloutApiRoute');
const utils = require('../lib/utils');

const PRIORITIZED_FILES = ['index.js', 'clout.hook.js'];

/**
 * Sort array by PRIORITIZED_FILES
 * @param {string} a string
 * @param {string} b string
 */
function sortByPriority(a, b) {
  const keys = {a, b};
  const getPriorityFor = key => PRIORITIZED_FILES.indexOf(keys[key]);
  const priorityIndexForA = getPriorityFor(a);
  const bPriority = getPriorityFor(b);
  const weight = {
    a: priorityIndexForA + 1,
    b: bPriority + 1,
  };

  const bBiggerThanA = weight.b > weight.a;
  const aBiggerThanB = weight.a > weight.b;

  if (aBiggerThanB) {
    return 1;
  }

  if (bBiggerThanA) {
    return -1;
  }

  return 0;
}

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
    const {basePath} = this.config;

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

    return globbedDirs.sort(sortByPriority).map(filePath => this.loadAPIFromFile(filePath));
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

/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
/**
 * @module clout-js/hooks/apis
 */
const path = require('path');
const CloutApiRoutes = require('../hookslib/CloutApiRoutes');

module.exports = {
  /**
   * initialize apis from application paths
   * @property {event} event start
   * @property {priority} priority API
   */
  initialize: {
    event: 'start',
    priority: 'API',
    fn(next) {
      const clientApiFolder = path.resolve(this.rootDirectory, 'apis');
      const apiDirs = this.modules
        .map(moduleInfo => path.resolve(moduleInfo.path, 'apis'))
        .concat([clientApiFolder]);

      if (!this.core) {
        this.core = {};
      }

      this.core.api = new CloutApiRoutes(this);
      this.core.api.loadAPIsFromDirs(apiDirs);
      this.core.api.attachRouterToApp();

      next();
    },
  },
};

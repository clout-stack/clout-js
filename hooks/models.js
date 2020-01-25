/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
/**
 * Models hooks
 * @module clout-js/hooks/models
 */
const debug = require('debug')('clout:hook/models');
const path = require('path');
const utils = require('../lib/utils');

module.exports = {
  /**
   * initialize models
   * @property {event} event start
   * @property {priority} priority MODEL
   */
  initialize: {
    event: 'start',
    priority: 'MODEL',
    fn(next) {
      debug('initialize models');
      this.models = {};
      // append to middleware
      this.app.request.models = this.models;
      next();
    },
  },
  /**
   * load models from application paths
   * @property {event} event start
   * @property {priority} priority MODEL + 2
   */
  loadModels: {
    event: 'start',
    priority: 18,
    fn(next) {
      const self = this;

      function loadModelsFromDir(dir) {
        const dirs = utils.getGlobbedFiles(path.join(dir, '**/**.js'));
        dirs.forEach((filePath) => {
          const modelName = filePath.split('models/')[1].replace('.js', '');
          debug('loading model %s', modelName);
          if (self.models[modelName]) {
            throw new Error(`Cannot load model \`${modelName}\` as it already exists`);
          }

          try {
            self.models[modelName] = require(filePath);
          } catch (e) {
            throw new Error(`Error loading model \`${modelName}\`: ${e}`);
          }
        });
      }

      debug('loading models');
      // 1) load module hooks
      this.modules.forEach((module) => {
        loadModelsFromDir(path.join(module.path, 'models'));
      });
      // 2) load application hooks
      loadModelsFromDir(path.join(self.rootDirectory, 'models'));
      next();
    },
  },
};

/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
/**
 * Rendering engines hooks
 * @module clout-js/hooks/engines
 */
const debug = require('debug')('clout:hook/engines');
const fs = require('fs-extra');
const path = require('path');

module.exports = {
  /**
   * initialize engine mechanist
   * @property {event} event start
   * @property {priority} priority 2
   */
  initialize: {
    event: 'start',
    priority: 2,
    fn(next) {
      const self = this;
      debug('initialize engines');
      this.app.engines = this.app.engines || {};

      Object.defineProperty(this.app.engines, 'add', {
        value: function add(ext, engine) {
          debug('adding engine %s', ext);
          self.app.engines[ext] = engine;
          self.app.engine(ext, engine);
        },
      });

      next();
    },
  },
  /**
   * attach EJS engine
   * @property {event} event start
   * @property {priority} priority MIDDLEWARE
   */
  html: {
    event: 'start',
    priority: 'MIDDLEWARE',
    fn(next) {
      debug('adding ejs engine for html');
      this.app.engines.add('html', require('ejs').__express);
      next();
    },
  },
  /**
   * attach EJS engine
   * @property {event} event start
   * @property {priority} priority MIDDLEWARE
   */
  ejs: {
    event: 'start',
    priority: 'MIDDLEWARE',
    fn(next) {
      debug('adding ejs engine');
      this.app.engines.add('ejs', require('ejs').__express);
      next();
    },
  },
  /**
   * attach HBS engine
   * @property {event} event start
   * @property {priority} priority MIDDLEWARE
   */
  hbs: {
    event: 'start',
    priority: 'MIDDLEWARE',
    fn(next) {
      debug('adding hbs engine');
      this.app.engines.add('hbs', require('hbs').__express);
      next();
    },
  },

  /**
   * attach rendering mechanism
   * @property {event} event start
   * @property {priority} priority MIDDLEWARE
   */
  render: {
    event: 'start',
    priority: 'MIDDLEWARE',
    fn(next) {
      this.app._render = this.app.render;
      this.app.render = function cloutRender(view, opts, cb) {
        const ext = path.extname(view);
        const {engines} = this;
        const dirs = this.get('views');
        const queue = [];

        // if no extension, try each
        if (!ext || !engines[ext]) {
          Object.keys(engines).forEach((engineExt) => {
            queue.push(`${view}.${engineExt}`);
            dirs.forEach((dir) => {
              queue.push(path.join(dir, `${view}.${engineExt}`));
            });
          });
        }

        // queue directly
        queue.push(view);
        dirs.forEach((dir) => {
          queue.push(path.join(dir, view));
        });

        const viewFilePath = queue.find(dir => fs.existsSync(dir));

        // not found
        if (!viewFilePath) {
          return cb(new Error(`Unable to find layout "${viewFilePath}"`));
        }

        // do original render
        return this._render.call(this, viewFilePath, opts, cb);
      };
      next();
    },
  },
};

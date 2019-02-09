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
      !this.app.engines && (this.app.engines = {});

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
      this.app.render = function (view, opts, cb) {
        let ext = path.extname(view),
          engines = this.engines,
          dirs = this.get('views'),
          queue = [],
          found = false;
        // if no extension, try each
        if (!ext || !engines[ext]) {
          Object.keys(engines).forEach((ext) => {
            queue.push(`${view}.${ext}`);
            dirs.forEach((dir) => {
              queue.push(path.join(dir, `${view}.${ext}`));
            });
          });
        }
        // queue directly
        queue.push(view);
        dirs.forEach((dir) => {
          queue.push(path.join(dir, view));
        });
        // run search
        do {
          const dir = queue.shift();
          if (fs.existsSync(dir)) {
            found = true;
            view = dir;
          }
        } while (!found && queue.length > 0);
        // not found
        if (!found) {
          return cb(new Error(`Unable to find layout "${view}"`));
        }
        // do original render
        this._render.call(this, view, opts, cb);
      };
      next();
    },
  },
};

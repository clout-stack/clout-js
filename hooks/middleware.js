/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
/**
 * Middleware hooks
 * @module clout-js/hooks/middleware
 */
const fs = require('fs-extra');
const path = require('path');
const express = require('express');
const debug = require('debug')('clout:hook/middleware');
const compress = require('compression');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const session = require('express-session');
const Q = require('q');

const DEFAULT_HTML_RENDER = 'htmljson';

module.exports = {
  /**
   * Initialize express application
   * @property {event} event start
   * @property {priority} priority 1
   */
  initialize: {
    event: 'start',
    priority: 1,
    fn(next) {
      // TODO:-
      //  - move to Clout.js for initialization
      this.app = express();
      this.app.use((req, resp, done) => {
        resp.setHeader('x-powered-by', 'Clout-JS');
        resp.setHeader('clout-version', `${this.package.version}`);
        resp.setHeader('clout-env', this.config.env);
        done();
      });

      // request parsing
      this.app.use(bodyParser.json());
      debug('loaded bodyParser.json()');
      this.app.use(bodyParser.urlencoded({
        extended: true,
      }));
      debug('loaded bodyParser.urlencoded()');
      this.app.use(bodyParser.text({}));
      debug('loaded bodyParser.text()');
      this.app.use(bodyParser.raw({}));
      debug('loaded bodyParser.raw()');
      this.app.use(cookieParser());
      next();
    },
  },
  /**
   * attach compression mechanism
   * @property {event} event start
   * @property {priority} priority MIDDLEWARE
   */
  compress: {
    event: 'start',
    priority: 'MIDDLEWARE',
    fn(next) {
      debug('appending compression to middleware');
      this.app.use(compress());
      next();
    },
  },
  /**
   * attach session mechanism
   * @property {event} event start
   * @property {priority} priority MIDDLEWARE
   */
  session: {
    event: 'start',
    priority: 'MIDDLEWARE',
    fn(next) {
      const sessionConf = this.config.session || {};

      if (!sessionConf.secret) {
        this.logger.warn('session.secret is undefined');
        sessionConf.secret = '1c6bf8c5cef18097a5389c3ca6d73328';
      }

      if (!sessionConf.resave) {
        sessionConf.resave = true;
      }

      if (!sessionConf.saveUninitialized) {
        sessionConf.saveUninitialized = false;
      }

      this.config.session = sessionConf;
      this.app.session = session(sessionConf);
      this.app.use(this.app.session);
      next();
    },
  },
  /**
   * attach public folders
   * @property {event} event start
   * @property {priority} priority MIDDLEWARE
   */
  publicFolders: {
    event: 'start',
    priority: 'MIDDLEWARE',
    fn(next) {
      const useDir = (dir) => {
        if (!fs.existsSync(dir)) { return; }
        debug('appending public dir %s', dir);
        this.app.use(express.static(dir));
      };

      // application public folder
      useDir(path.join(this.rootDirectory, 'public'));

      // modules
      this.modules.forEach(module => useDir(path.join(module.path, 'public')));

      // clout public folder
      useDir(path.join(__dirname, '../resources/public'));

      next();
    },
  },
  /**
   * attach views folders
   * @property {event} event start
   * @property {priority} priority MIDDLEWARE
   */
  views: {
    event: 'start',
    priority: 'MIDDLEWARE',
    fn(next) {
      const views = [];

      function useDir(dir) {
        if (!fs.existsSync(dir)) { return; }
        debug('appending views dir %s', dir);
        views.push(dir);
      }

      // application public folder
      useDir(path.join(this.rootDirectory, 'views'));

      // modules
      this.modules.forEach(module => useDir(path.join(module.path, 'views')));

      // clout public folder
      useDir(path.join(__dirname, '../resources/views'));

      // set views
      this.app.set('views', views);
      next();
    },
  },
  request: {
    event: 'start',
    priority: 'MIDDLEWARE',
    fn(next) {
      // TODO:-
      // - Support converting form data
      // - Support multipart data
      next();
    },
  },
  /**
   * attach clout response mechanism
   * @property {event} event start
   * @property {priority} priority MIDDLEWARE
   */
  response: {
    event: 'start',
    priority: 'MIDDLEWARE',
    fn(next) {
      const {httpResponseMap} = this.config;

      function jsonFormat(method, context, payload) {
        return () => {
          context
            .type('json')
            .status(method.code)
            .send(JSON.stringify(payload.data));
        };
      }

      function htmlFormat(_method, context, payload) {
        return () => {
          const method = _method.render
            ? _method
            : {..._method, ...{render: DEFAULT_HTML_RENDER}};

          context
            .status(method.code)
            .render(method.render, {
              data: payload.data,
            });
        };
      }

      // TODO:-
      // - refactor to add support for more file types (CSV, XML)
      // - success: false should point to an error html response
      Object.keys(httpResponseMap).forEach((methodName) => {
        const method = httpResponseMap[methodName];

        if (typeof express.response[methodName] !== 'undefined') {
          debug('overiding express response method `%s`', methodName);
        }

        express.response[methodName] = function cloutResponse(data) {
          const deffered = Q.defer();
          const payload = {
            data,
            code: method.code,
            success: method.method,
          };

          // bind our formaters
          const jsonFormatFn = jsonFormat(method, this, payload);
          const htmlFormatFn = htmlFormat(method, this, payload);

          // let express choose the format
          this.format({
            text: jsonFormatFn,
            json: jsonFormatFn,
            html: htmlFormatFn,
            default: htmlFormatFn,
          });

          deffered.resolve();
          return deffered.promise;
        };
      });

      next();
    },
  },
  /**
   * attach error handling
   * @property {event} event start
   */
  errorHandler: {
    event: 'start',
    fn(next) {
      this.app.use((err, req, resp, done) => {
        if (!err) { return done(); }
        req.logger.error(err.stack);
        return resp.error(err);
      });
      next();
    },
  },
};

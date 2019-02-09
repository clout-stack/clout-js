/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
/**
 * Server hooks
 * @module clout-js/hooks/server
 */
const debug = require('debug')('clout:hook/server');
const https = require('https');

module.exports = {
  /**
   * http instance
   * @property {event} event start
   * @property {priority} priority 25
   */
  http: {
    event: 'start',
    priority: 25,
    fn(next) {
      const self = this;
      const port = process.env.PORT || (this.config.http && this.config.http.port) || 8080;

      this.server.http = this.app.listen(port, () => {
        if (self.server.http.address()) {
          debug('http server started on port %s', self.server.http.address().port);
        }
        next();
      });
    },
  },
  /**
   * stop http instance
   * @property {event} event stop
   * @property {priority} priority 25
   */
  httpStop: {
    event: 'stop',
    priority: 25,
    fn(next) {
      const {http} = this.server;

      if (http) {
        const {port} = http.address();

        http.close();
        debug('http server stopped on port %s', port);
      }

      next();
    },
  },
  /**
   * https instance
   * @property {event} event start
   * @property {priority} priority 25
   */
  https: {
    event: 'start',
    priority: 25,
    fn(next) {
      if (!this.config.https) { return next(); }
      debug('Securely using https protocol');
      const port = process.env.SSLPORT || this.config.https.port || 8443;
      const conf = this.config.https;

      if (!conf) { return next(); }

      this.server.https = https.createServer(conf, this.app).listen(port);
      debug('https server started on port %s', this.server.https.address().port);
      next();
    },
  },
  /**
   * stop https instance
   * @property {event} event stop
   * @property {priority} priority 25
   */
  httpsStop: {
    event: 'stop',
    priority: 25,
    fn(next) {
      if (this.server.https) {
        const {port} = this.server.https.address();

        this.server.https.close();
        debug('https server stopped on port %s', port);
      }

      next();
    },
  },
};

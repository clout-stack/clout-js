/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
/**
 * Server hooks
 * @module clout-js/hooks/server
 */
const
	debug = require('debug')('clout:hook/server'),
	https = require('https');

module.exports = {
	/**
	 * http instance
	 * @property {event} event start
	 * @property {priority} priority 25
	 */
	http: {
		event: 'start',
		priority: 25,
		fn: function (next) {
			var self = this,
				port = process.env.PORT || this.config.http && this.config.http.port || 8080;
			this.server.http = this.app.listen(port, function () {
				if (self.server.http.address()) {
					debug('http server started on port %s', self.server.http.address().port);
				}
				next();
			});
		}
	},
	/**
	 * stop http instance
	 * @property {event} event stop
	 * @property {priority} priority 25
	 */
	httpStop: {
		event: 'stop',
		priority: 25,
		fn: function (next) {
			let http = this.server.http;

			if (http) {
				let port = http.address().port;
				http.close();
				debug('http server stopped on port %s', port);
			}

			next();
		}
	},
	/**
	 * https instance
	 * @property {event} event start
	 * @property {priority} priority 25
	 */
	https: {
		event: 'start',
		priority: 25,
		fn: function (next) {
			if (!this.config.https) { return next(); }
			debug('Securely using https protocol');
			var port = process.env.SSLPORT || this.config.https.port || 8443,
				conf = this.config.https;

			if (!conf) { return next(); }

			this.server.https = https.createServer(conf, this.app).listen();
			debug('https server started on port %s', this.server.https.address().port);
			next();
		}
	},
	/**
	 * stop https instance
	 * @property {event} event stop
	 * @property {priority} priority 25
	 */
	httpsStop: {
		event: 'stop',
		priority: 25,
		fn: function (next) {
			let https = this.server.https;

			if (https) {
				let port = https.address().port;
				https.close();
				debug('https server stopped on port %s', port);
			}

			next();
		}
	},
};

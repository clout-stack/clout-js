/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const
	fs = require('fs-extra'),
	path = require('path'),
	express = require('express'),
	debug = require('debug')('clout:hook/middleware'),
	compress = require('compression')
	bodyParser = require('body-parser'),
	cookieParser = require('cookie-parser'),
	session = require('express-session');

module.exports = {
	initialize: {
		event: 'start',
		priority: 1,
		fn: function (next) {
			this.app = express();
			this.app.set('x-powered-by', 'Clout-JS');
			this.app.set('env', this.config.env);
			this.app.set('server', 'Clout-JS v' + this.package.version);

			// request parsing
			this.app.use(bodyParser.json());
			debug('loaded bodyParser.json()');
			this.app.use(bodyParser.urlencoded({
				extended: false
			}));
			debug('loaded bodyParser.urlencoded()');
			this.app.use(bodyParser.text({}));
			debug('loaded bodyParser.text()');
			this.app.use(bodyParser.raw({}));
			debug('loaded bodyParser.raw()');
			this.app.use(cookieParser());
			next();
		}
	},
	compress: {
		event: 'start',
		priority: 'MIDDLEWARE',
		fn: function (next) {
			debug('appending compression to middleware');
			this.app.use(compress());
			next();
		}
	},
	session: {
		event: 'start',
		priority: 'MIDDLEWARE',
		fn: function (next) {
			var sessionConf = this.config.session || {};
			if (!sessionConf.secret) {
				this.logger.warn('session.secret is undefined');
				sessionConf.secret = '1c6bf8c5cef18097a5389c3ca6d73328';
			}
			if (!sessionConf.hasOwnProperty('resave')) {
				sessionConf.resave = true;
			}
			if (!sessionConf.hasOwnProperty('saveUninitialized')) {
				sessionConf.saveUninitialized = false;
			}
			this.config.session = sessionConf;
			this.app.session = session(sessionConf);
			this.app.use(this.app.session);
			next();
		}
	},
	publicFolders: {
		event: 'start',
		priority: 'MIDDLEWARE',
		fn: function (next) {
			var self = this;
			function useDir(dir) {
				if (!fs.existsSync(dir)) { return; }
				debug('appending public dir %s', dir);
				self.app.use(express.static(dir));
			}
			// application public folder
			useDir(path.join(this.rootDirectory, 'public'));
			// modules
			this.modules.forEach(function (module) {
				useDir(path.join(module.path, 'public'));
			});
			// clout public folder
			useDir(path.join(__dirname, '../resources/public'));
			next();
		}
	},
	views: {
		event: 'start',
		priority: 'MIDDLEWARE',
		fn: function (next) {
			var views = [];
			function useDir(dir) {
				if (!fs.existsSync(dir)) { return; }
				debug('appending views dir %s', dir);
				views.push(dir);
			}
			// application public folder
			useDir(path.join(this.rootDirectory, 'views'));
			// modules
			this.modules.forEach(function (module) {
				useDir(path.join(module.path, 'views'));
			});
			// clout public folder
			useDir(path.join(__dirname, '../resources/views'));
			// set views
			this.app.set('views', views);
			next();
		}
	},
	request: {
		event: 'start',
		priority: 'MIDDLEWARE',
		fn: function (next) {
			// TODO:-
			// - Support converting form data
			// - Support multipart data
			next();
		}
	},
	response: {
		event: 'start',
		priority: 'MIDDLEWARE',
		fn: function (next) {
			var httpResponseMap = this.config.httpResponseMap,
				methods = Object.keys(httpResponseMap);

			// TODO:-
			// - refactor to add support for more file types (CSV, XML)
			// - success: false should point to an error html response
			methods.forEach(function (methodName) {
				var method = httpResponseMap[methodName];
				express.response[methodName] = function (data) {
					var self = this,
						format = {},
						payload = _.merge({
							data: data
						}, {
							code: method.code,
							success: method.method
						});
					format.text = 
					format.json = function () {
						self
							.type('json')
							.status(method.code)
							.send(JSON.stringify(payload));
					}
					format.html = function () {
						!method.render && (method.render = 'htmljson');
						self
							.status(method.code)
							.render(method.render, {
								data: payload
							});
					}
					this.format(format);
				};
			});
			next();
		}
	},
	leastButNotLast: {
		event: 'start',
		fn: function (next) {
			next();
			this.app.use(function (err, req, resp, next) {
				if (!err) { return next(); }
				
				req.logger.error(err.stack);
				resp.error(err);
			});

			// Assume 404 since no middleware responded
			this.app.use(function (req, resp) {
				resp.notFound();
			});
		}
	}
};
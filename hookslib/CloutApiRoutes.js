/*!
 * clout-js
 * Copyright(c) 2018 Muhammad Dadu
 * MIT Licensed
 */
/**
 * @module clout-js/hookslib/CloutApiRoutes
 */

const { merge } = require('lodash');
const CloutApiRoute = require('../hookslib/CloutApiRoute');
const express = require('express');
const utils = require('../lib/utils');
const path = require('path');

/**
 * CloutApiRoutes
 * @class
 */
module.exports = class CloutApiRoutes {

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
                html: 'text/html'
            }
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
            let acceptType = this.config.acceptTypes[type];

            req.logger.info(`handling param '${acceptType}'`);

            if (acceptType) {
                req.headers['accept'] = `${acceptType},` + req.headers['accept'];
            };

            next();
        });
    }

    /**
     * Attaches router to clout-app
     */
    attachRouterToApp() {
        let basePath = this.config.basePath;

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
        let groupName = path.basename(filePath).replace('.js', '');
        let apis = require(filePath);

        this.clout.logger.debug(`loading API from file ${filePath}`);

        return Object.keys(apis).map((apiName) => {
            let opts = merge({
                method: 'all',
                name: apiName,
                group: groupName
            }, apis[apiName]);

            return this.addRoute(new CloutApiRoute(opts));
        });
    }

	/**
	 * Finds all the **.js files inside a directory and loads it
	 * @param {string} dir path containing directory of APIs
	 */
    loadAPIsFromDir(dir) {
        let globbedDirs = utils.getGlobbedFiles(path.join(dir, '**/**.js'));

        return globbedDirs.map((filePath) => this.loadAPIFromFile(filePath));
    }

	/**
	 * Finds all the **.js files inside an array of directories and loads it
	 * @param {array} dirs array of paths containing directory of APIs
	 */
    loadAPIsFromDirs(dirs) {
        return dirs.map((dir) => this.loadAPIsFromDir(dir));
    }
};

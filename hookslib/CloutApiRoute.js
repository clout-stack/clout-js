/*!
 * clout-js
 * Copyright(c) 2018 Muhammad Dadu
 * MIT Licensed
 */
const {safePromisifyCall} = require('../lib/utils');
const types = require('./apiType');

const DEFAULT_METHOD = 'all';
const TYPES_DEFINITION = {
    API: 'api',
    PARAM: 'param'
};
const DEFAULT_TYPE = TYPES_DEFINITION.API;

/**
 * CloutApiRoute
 * @class
 */
class CloutApiRoute {
    /**
     * @constructor
     * @param {object} _opts
     * @param {string} _opts.path
     * @param {array} [_opts.hooks]
     * @param {string} [_opts.method]
     * @param {array} [_opts.methods]
     * @param {string} _opts.group
     * @param {string} _opts.name
     * @param {string} _opts.description
     * @param {function} _opts.fn
     */
    constructor(_opts) {
        this._opts = _opts;

        this.type = this._opts.type || DEFAULT_TYPE;
        this.isPublicFacing = this.type.includes('api');

        switch (this.type) {
            case TYPES_DEFINITION.PARAM:
                this.param = this._opts.param;
                this.result = this._opts.result;
                break;
            default:
                this.path = this._opts.path;
                this.hooks = this._opts.hooks || [];
                this.methods = (this._opts.methods || [this._opts.method || DEFAULT_METHOD]).map((method) => method.toLowerCase());
                this.params = this._opts.params; // TODO:- time to start packing modules? clout-swagger
                break;
        }

        // Documentation Specific
        this.group = this._opts.group;
        this.name = this._opts.name;
        this.description = this._opts.description;

        // What actually runs
        this.fn = this._opts.fn;
    }

    /**
     * handles router method in a promise
     * @param {*} fn RouterCallback
     */
    handlePromisePostTriggers(fn) {
        const {isPublicFacing} = this;
        return function (req, resp, next, ...args) {
            safePromisifyCall(fn, this, [req, resp, null, ...args])
                .then((data) => {
                    if (isPublicFacing) {
                        return resp.ok(data);
                    }

                    next(null, data)
                })
                .catch((err) => next(err));
        }
    }

    /**
     * attach express router
     * @param {object} router express router
     */
    attachRouter(router) {
        const apiPath = this.path && `${this.path}.:acceptType?`;
        const type = this.type

        this.router = router;

        // it's an endpoint
        if (type === TYPES_DEFINITION.API) {
            return this.methods.forEach((method) => {
                // attach logging
                this.router[method](apiPath, function (req, resp, next) {
                    req.logger.info('Endpoint [%s] /api%s', req.method, req.path);
                    next();
                });

                // attach hooks
                this.hooks.map((hook) => this.router[method](apiPath, this.handlePromisePostTriggers(hook)));

                this.router[method](apiPath, this.handlePromisePostTriggers(this.fn));
            });
        }

        // it's a param definition
        if (type === TYPES_DEFINITION.PARAM) {
            const cloutApiParam = types.param.fn.apply(this, [this.fn]);
            this.router.param(this.param, cloutApiParam);
        }
    }
};

module.exports = CloutApiRoute;

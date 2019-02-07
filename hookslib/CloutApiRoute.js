/*!
 * clout-js
 * Copyright(c) 2018 Muhammad Dadu
 * MIT Licensed
 */

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

    handlePromisePostTriggers(fn) {
        const type = this.type;
        const key = this.result || this.param;

        return function (req, resp, next, ...args) {
            let maybePromise = fn.apply(this, [req, resp, next, ...args]);

            if (!maybePromise || !maybePromise.then) {
                return;
            }

            switch (type) {
                case TYPES_DEFINITION.PARAM:
                        if (!req._params) { req._params = {}; }

                        if (!req.param.get) {
                            req.param.get = (key) => req._params[key];
                        }

                        maybePromise.then((paramData) => req._params[key] = paramData)
                            .then(() => next());
                    break;
                default:
                    maybePromise.then((data) => resp.ok(data));
                    break;
            }

            return maybePromise.catch((err) => next(err));
        };
    }

    /**
     * attach express router
     * @param {object} router express router
     */
    attachRouter(router) {
        this.router = router;

        if (this.type === TYPES_DEFINITION.PARAM) {
            return this.router.param(this.param, this.handlePromisePostTriggers(this.fn));
        }

        return this.methods.forEach((method) => {
            // it's an endpoint
            if (this.path) {
                let path = `${this.path}.:acceptType?`;

                // attach logging
                this.router[method](path, function (req, resp, next) {
                    req.logger.info('Endpoint [%s] /api%s', req.method, req.path);
                    next();
                });

                // attach hooks
                this.hooks.map((hook) => this.router[method](path, this.handlePromisePostTriggers(hook)));

                // execute fn
                this.router[method](path, this.handlePromisePostTriggers(this.fn));
            }
        });
    }
};

module.exports = CloutApiRoute;

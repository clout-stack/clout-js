/*!
 * clout-js
 * Copyright(c) 2018 Muhammad Dadu
 * MIT Licensed
 */
/**
 * @module clout-js/hookslib/CloutApiRoute
 */

/**
 * CloutApiRoute
 * @class
 */
module.exports = class CloutApiRoute {
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

        this.path = this._opts.path;
        this.hooks = this._opts.hooks || [];
        this.methods = (this._opts.methods || [this._opts.method]).map((method) => method.toLowerCase());

        this.group = this._opts.group;
        this.name = this._opts.name;
        this.description = this._opts.description;
        this.params = this._opts.params; // do something with this maybe

        this.fn = this._opts.fn;
    }

    /**
     * attach express router
     * @param {object} router express router
     */
    attachRouter(router) {
        this.router = router;

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
                this.hooks.map((hook) => this.router[method](path, hook));

                // execute fn
                if (this.fn) {
                    this.router[method](path, this.fn);
                }
            }

        });
    }
};

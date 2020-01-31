/*!
 * clout-js
 * Copyright(c) 2018 Muhammad Dadu
 * MIT Licensed
 */
const { safePromisifyCallFn } = require('../lib/utils');
const types = require('./apiType');

const DEFAULT_METHOD = 'all';
const TYPES_DEFINITION = {
  API: 'api',
  PARAM: 'param',
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

    this.type = (this._opts.type || DEFAULT_TYPE).toLowerCase();
    this.isPublicFacing = this.type.includes('api');

    const methods = this._opts.methods || [this._opts.method || DEFAULT_METHOD];

    switch (this.type) {
      case TYPES_DEFINITION.PARAM:
        this.param = this._opts.param;
        this.result = this._opts.result;
        break;
      default:
        this.path = this._opts.path;
        this.hooks = this._opts.hooks || [];
        this.methods = (methods).map(method => method.toLowerCase());
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
    const { isPublicFacing } = this;
    return function postPromiseHandle(req, resp, next, ...args) {
      safePromisifyCallFn(fn, this, [req, resp, null, ...args])
        .then((data) => {
          if (isPublicFacing) {
            if (!resp.headerSent) {
              return resp.ok(data);
            }
          } else {
            return next(null, data);
          }
        })
        .catch(err => next(err));
    };
  }

  /**
     * attach express router
     * @param {object} router express router
     */
  attachRouter(router) {
    this.router = router;

    const matchedApiType = types[this.type];

    if (matchedApiType) {
      matchedApiType.fn.apply(this, [this.fn]);
    } else {
      console.error(`unrecognised type ${this.type}`);
    }
  }
}

module.exports = CloutApiRoute;

const { safePromisifyCallFn } = require('../../lib/utils');
const CloutAPIRoute = require('../CloutApiRoute');

const request = require('express/lib/request');

request.param = function (name) {
  const { _params } = this;

  return _params[name];
};

module.exports = {
  fn(fn) {
    const key = this.result || this.param;

    async function cloutApiParam(req, resp, next, ...args) {
      req._params = req._paramsparams || {};

      try {
        req._params[key] = await safePromisifyCallFn(fn, this, [req, resp, null, ...args]);
        next();
      } catch (err) {
        next(err);
      }
    }

    this.router.param(this.param, cloutApiParam);
  },
};

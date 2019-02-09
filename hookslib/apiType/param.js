const request = require('express/lib/request');
const { safePromisifyCallFn } = require('../../lib/utils');

const expressRequestParam = request.param;

request.param = function cloutParam(name) {
  const { _params } = this;

  return _params[name] || expressRequestParam.apply(this, [name]);
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

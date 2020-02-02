const debug = require('debug')('clout-js:api');
const { safePromisifyCallFn } = require('../../lib/utils');

/**
 * handles API fn method in a promise
 * @param {*} fn RouterCallback
 * @param {boolean} isPublicFacing isPublicFacing
 */
function handlePromiseAPIDef(fn) {
  return function postPromiseHandle(req, resp, next, ...args) {
    safePromisifyCallFn(fn, this, [req, resp, null, ...args])
      .then((data) => {
        const headerSent = !!resp._header;
        if (!headerSent) {
          return resp.ok(data);
        }
      })
      .catch(err => next(err));
  };
}

module.exports = {
  name: 'api',
  fn(fn) {
    const apiPath = this.path && `${this.path}.:acceptType?`;

    const attachHook = (method, hookFn) => this.router[method](
      apiPath,
      (req, resp, next, ...args) => safePromisifyCallFn(hookFn, this, [req, resp, next, ...args]),
    );

    this.methods.forEach((method) => {
      // attach logging
      this.router[method](apiPath, (req, resp, next) => {
        req.logger.info('Endpoint [%s] /api%s', req.method, req.path);
        next();
      });

      // attach hooks
      this.hooks
        .filter((hookFn) => {
          const isFunction = typeof hookFn === 'function';
          if (!isFunction) {
            console.error({apiPath, isFunction}, 'hook is not a function');
          }

          return isFunction;
        })
        .map((hookFn) => {
          debug({method, hookFn}, 'attaching hookFn for method');
          return attachHook(method, hookFn);
        });

      this.router[method](apiPath, handlePromiseAPIDef(fn));
    });
  },
};

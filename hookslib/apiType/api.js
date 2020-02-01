const debug = require('debug')('clout-js:api');

module.exports = {
  name: 'api',
  fn(fn) {
    const apiPath = this.path && `${this.path}.:acceptType?`;

    const attachHook = (method, hookFn) => this.router[method](
      apiPath,
      this.handlePromisePostTriggers(hookFn, false),
    );

    this.methods.forEach((method) => {
      // attach logging
      this.router[method](apiPath, (req, resp, next) => {
        req.logger.info('Endpoint [%s] /api%s', req.method, req.path);
        next();
      });

      // attach hooks
      this.hooks
        .filter(hookFn => {
          const isFunction = typeof hookFn === 'function';
          if (!isFunction) {
            console.error({apiPath, isFunction}, 'hook is not a function');;
          }

          return isFunction;
        })
        .map(hookFn => {
          debug({method, hookFn}, 'attaching hookFn for method');
          return attachHook(method, hookFn);
        });

      this.router[method](apiPath, this.handlePromisePostTriggers(fn));
    });
  },
};

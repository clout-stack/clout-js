module.exports = {
  name: 'api',
  fn(fn) {
    const apiPath = this.path && `${this.path}.:acceptType?`;

    function attachHook(method, hookFn) {
      return this.router[method](apiPath, this.handlePromisePostTriggers(hookFn));
    }

    this.methods.forEach((method) => {
      // attach logging
      this.router[method](apiPath, (req, resp, next) => {
        req.logger.info('Endpoint [%s] /api%s', req.method, req.path);
        next();
      });

      // attach hooks
      this.hooks.map(hookFn => attachHook(method, hookFn));

      this.router[method](apiPath, this.handlePromisePostTriggers(fn));
    });
  },
};

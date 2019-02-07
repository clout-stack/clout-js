const {safePromisifyCallFn} = require('../../lib/utils');
const CloutAPIRoute = require('../CloutApiRoute');

module.exports = {
    fn(fn) {
        const apiPath = this.path && `${this.path}.:acceptType?`;

        this.methods.forEach((method) => {
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
};

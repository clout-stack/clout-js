const {safePromisifyCall} = require('../../lib/utils');
const CloutAPIRoute = require('../CloutApiRoute');

module.exports = {
    fn(fn) {
        const key = this.result || this.param;

        return function (req, resp, next, ...args) {
            if (!req._params) { req._params = {}; }

            if (!req.param.get) {
                req.param.get = (key) => req._params[key];
            }

            safePromisifyCall(fn, this, [req, resp, null, ...args])
                .then(data => {
                    req._params[key] = data;
                    next(null, data);
                })
                .catch(err => next(err));
        }
    }
};

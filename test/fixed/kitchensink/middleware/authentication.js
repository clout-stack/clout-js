const authToken = 'test-auth-token';

module.exports = {
    isAuthenticated: (req, resp, next) => {
        const isValidToken = req.header('X-Auth-Token') === authToken;

        if (!isValidToken) {
            return resp.unauthorized();
        }

        return next();
    }
};

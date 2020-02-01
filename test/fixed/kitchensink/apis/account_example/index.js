/**
 * User API Example
 * Define API settings and helpers
 */

module.exports = {
    userId: {
        type: 'param',
        param: 'userId',
        result: 'user',
        description: 'define userId',
        fn: (req, resp, next, userId) => {
            return req.models.user.getById(userId)
                .catch((err) => {
                    req.logger.error(err);
                    throw err;
                });
        }
    }
};

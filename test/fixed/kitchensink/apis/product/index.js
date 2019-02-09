/**
 * Product API Example
 * Define API settings and helpers
 */

module.exports = {
    productId: {
        type: 'param',
        param: 'productId',
        result: 'product',
        description: 'define productId',
        fn: (req, resp, next, productId) => {
            return req.models.product.getById(productId)
                .catch((err) => {
                    req.logger.error(err);
                    throw err;
                });
        }
    }
};

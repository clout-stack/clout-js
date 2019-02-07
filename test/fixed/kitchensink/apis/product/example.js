/**
 * Simple API Example
 */
module.exports = {
    list: {
        path: '/product',
        method: 'get',
        description: `
            API Example to demonstrate simple key value storage using a product model
        `,
        fn: (req, resp) => {
            const productModel = req.models.product;

            return productModel.list();
        }
    },
    put: {
        path: '/product',
        method: 'put',
        params: {
            name: 'string',
            model: 'string',
            year: 'string'
        },
        description: `
            API Example to demonstrate simple key value storage using a product model
        `,
        fn: (req, resp) => {
            const productModel = req.models.product;
            const params = req.body;

            return productModel.add(params);
        }
    },
    getById: {
        path: '/product/:productId',
        method: 'get',
        description: `
            API Example to demonstrate advanced routing
        `,
        fn: (req, resp) => {
            resp.ok(req.param.get('product'));
        }
    },
    delete: {
        path: '/product/:productId',
        method: 'delete',
        description: `
            API Example to demonstrate advanced routing
        `,
        fn: (req, resp) => {
            req.param.get('product').delete()
                .then(() => resp.ok({}));
        }
    }
};

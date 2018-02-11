/**
 * Simple API Example
 */
module.exports = {
    get: {
        path: '/simple',
        method: 'get',
        description: `
            API Example to demonstrate simple key value storage using a simple model
        `,
        fn: (req, resp) => {
            let simpleModel = req.models.simple;

            simpleModel.list()
                .then((simpleItems) => resp.ok(simpleItems))
                .catch((err) => resp.notFound(err));
        }
    },
    getById: {
        path: '/simple/:id',
        method: 'get',
        description: `
            API Example to demonstrate simple key value storage using a simple model
        `,
        fn: (req, resp) => {
            let simpleModel = req.models.simple;
            let params = req.params;

            simpleModel.getById(params.id)
                .then((simpleItems) => resp.ok(simpleItems))
                .catch((err) => resp.error(err));
        }
    },
    put: {
        path: '/simple',
        method: 'put',
        params: {
            name: 'string',
            model: 'string',
            year: 'string'
        },
        description: `
            API Example to demonstrate simple key value storage using a simple model
        `,
        fn: (req, resp) => {
            let simpleModel = req.models.simple;
            let params = req.body;

            simpleModel.create(params)
                .then(() => resp.ok(req.body))
                .catch((err) => resp.error(err));
        }
    },
    delete: {
        path: '/simple/:id',
        method: 'delete',
        description: `
            API Example to demonstrate simple key value storage using a simple model
        `,
        fn: (req, resp) => {
            let simpleModel = req.models.simple;
            let params = req.params;

            simpleModel.deleteById({ id: params.id })
                .then(() => resp.ok(req.body))
                .catch((err) => resp.error(err));
        }
    }
};
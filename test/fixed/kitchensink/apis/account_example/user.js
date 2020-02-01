/**
 * Simple API Example
 */
const {isAuthenticated} = require('../../middleware/authentication');

module.exports = {
    list: {
        path: '/user',
        method: 'get',
        description: `
            API Example to demonstrate simple key value storage using a user model
        `,
        hooks: [isAuthenticated],
        fn: (req, resp) => {
            const UserDB = req.models.user;

            return UserDB.list();
        }
    },
    create: {
        path: '/user',
        method: 'put',
        params: {
            name: 'string',
            email: 'string'
        },
        description: `
            API Example to demonstrate simple key value storage using a user model
        `,
        fn: (req, resp) => {
            const UserDB = req.models.user;
            const params = req.body;

            return UserDB.add(params);
        }
    },
    getById: {
        path: '/user/:userId',
        method: 'get',
        description: `
        API Example to demonstrate advanced routing
        `,
        hooks: [isAuthenticated],
        fn: (req, resp) => {
            resp.ok(req.param('user'));
        }
    },
    delete: {
        path: '/user/:userId',
        method: 'delete',
        description: `
        API Example to demonstrate advanced routing
        `,
        hooks: [isAuthenticated],
        fn: (req, resp) => {
            req.param('user').delete()
                .then(() => resp.ok({}));
        }
    }
};

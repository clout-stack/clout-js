const should = require('should');
const testLib = require('./lib');
const request = testLib.request;
const {merge} = require('lodash');

const USER_1 = {
    name: 'Dadu',
    email: 'dadu@test.com',
};

const USER_2 = {
    name: 'Marcos',
    email: 'marcos@test.com',
};

describe('e2e User Auth Tests', function () {
    let clout;

    before(() => {
        process.env.PORT = 8420;
        process.env.NODE_ENV = 'test';
        clout = testLib.createInstance();
    });

    it('start server', (done) => {
        clout.start();
        clout.on('started', () => {
            let server = clout.server['http'];
            if (server) {
                let port = server.address().port;
                serverAddress = `http://localhost:${port}`;
            }
            done();
        });
    });

    describe('/user - non authenticated', () => {
        it('should give 403 /user', async () => {
            const response = await request({ uri: `/api/user`, json: true });
            should(response.statusCode).be.equal(401);
        });

        it('should add 1 user to /user', async () => {
            const response = await request({
                method: 'put',
                uri: `/api/user`,
                body: USER_1,
                json: true
            });

            should(response.body).be.deepEqual(merge({ id: 1 }, USER_1));
        });
    });



    describe('/user - example api', () => {
        const headers = {
            'X-Auth-Token': 'test-auth-token',
        }

        it('should return 1 item from /user', async () => {
            const response = await request({ uri: `/api/user`, json: true , headers});
        
            should(response.statusCode).be.equal(200);
            should(response.body.length).be.equal(1);
        });

        it('should add 1 more item to /user', async () => {
            const response = await request({
                method: 'put',
                uri: `/api/user`,
                body: USER_2,
                json: true,
                headers,
            });

            should(response.body).be.deepEqual(merge({ id: 2 }, USER_2));
        });

        it('should return 2 items from /user', async () => {
            const response = await request({ uri: `/api/user`, json: true, headers });
        
            should(response.statusCode).be.equal(200);
            should(response.body.length).be.equal(2);
        });

        it('should delete an item from /user/2 & /user/3', async () => {
            await request({ uri: `/api/user/1`, method: 'delete', json: true, headers });
            await request({ uri: `/api/user/2`, method: 'delete', json: true, headers });
            
            const response = await request({ uri: `/api/user`, json: true, headers });

            should(response.statusCode).be.equal(200);
            should(response.body.length).be.equal(0);
        });
    });

    after('stop server', (done) => {
        clout.on('stopped', () => done());
        clout.stop();
    });
});

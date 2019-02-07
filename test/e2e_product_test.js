const should = require('should');
const testLib = require('./lib');
const request = testLib.request;
const {merge} = require('lodash');

const EXAMPLE_ITEM_1 = {
    make: 'BMW',
    model: 'E30',
    year: '1994'
};

describe('e2e Product Tests', function () {
    let clout;
    let serverAddress;

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

    describe('/product - example api', () => {
        it('should return 0 items from /product', (done) => {
            request({ uri: `/api/product`, json: true })
                .then((response) => {
                    should(response.statusCode).be.equal(200);
                    should(response.body.length).be.equal(0);
                    done();
                });
        });

        it('should add 1 item to /product', async () => {
            const response = await request({
                method: 'put',
                uri: `/api/product`,
                body: EXAMPLE_ITEM_1,
                json: true
            });

            should(response.body).be.deepEqual(merge({ id: 1 }, EXAMPLE_ITEM_1));
        });

        it('should return 1 item from /product', async () => {
            const response = await request({ uri: `/api/product`, json: true });
        
            should(response.statusCode).be.equal(200);
            should(response.body.length).be.equal(1);
        });

        it('should return an item from /product/1', async () => {
            const response = await request({ uri: `/api/product/1`, json: true });
            const data = response.body;

            should(response.statusCode).be.equal(200);
            should(data.id).be.deepEqual('1');

            should(data).be.deepEqual({ make: 'BMW', model: 'E30', year: '1994', id: '1' });
        });

        it('should return html response from /product/1.html', async () => {
            const response = await request({ uri: `/api/product/1.html`, json: true });
            const data = response.body;

            should(typeof data).be.equal('string');
        });

        it('should delete an item from /product/1', async () => {
            await request({ uri: `/api/product/1`, method: 'delete', json: true });

            const response = await request({ uri: `/api/product`, json: true });

            should(response.statusCode).be.equal(200);
            should(response.body.length).be.equal(0);
        });
    });

    after('stop server', (done) => {
        clout.on('stopped', () => done());
        clout.stop();
    });
});

const should = require('should');
const testLib = require('./lib');
const request = testLib.request;
const {merge} = require('lodash');

const EXAMPLE_ITEM_1 = {
    make: 'BMW',
    model: 'E30',
    year: '1994'
};

describe('API Tests', function () {
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

    it('check api response headers', (done) => {
        request({ uri: `/api` })
        .then((response) => {
            should(response.headers['x-powered-by']).be.equal('Clout-JS');
            should(response.headers['clout-env']).be.equal(process.env.NODE_ENV);
            done();
        });
    });

    describe('/simple - example api', () => {
        it('should return 0 items from /simple', (done) => {
            request({ uri: `/api/simple`, json: true })
                .then((response) => {
                    should(response.body.code).be.equal(200);
                    should(response.body.data.length).be.equal(0);
                    done();
                });
        });

        it('should add 1 item to /simple', (done) => {
            request({
                method: 'put',
                uri: `/api/simple`,
                body: EXAMPLE_ITEM_1,
                json: true
            })
            .then((response) => {
                should(response.body.data).be.deepEqual(merge({ id: 1 }, EXAMPLE_ITEM_1));
                done();
            });
        });

        it('should return 1 item from /simple', (done) => {
            request({ uri: `/api/simple`, json: true })
                .then((response) => {
                    should(response.body.code).be.equal(200);
                    should(response.body.data.length).be.equal(1);
                    done();
                });
        });

        it('should return an item from /simple/1', (done) => {
            request({ uri: `/api/simple/1`, json: true })
                .then((response) => {
                    let data = response.body.data;
                    should(response.body.code).be.equal(200);
                    should(data.id).be.deepEqual(1);
                    done();
                });
        });

        it('should return html response from /simple/1.html', (done) => {
            request({ uri: `/api/simple/1.html`, json: true })
                .then((response) => {
                    let data = response.body;
                    should(typeof data).be.equal('string');
                    done();
                });
        });

        it('should delete an item from /simple/1', function (done) {
            request({ uri: `/api/simple/1`, method: 'delete', json: true })
                .then((response) => response.body.data)
                .then(() => request({ uri: `/api/simple`, json: true }))
                .then((response) => {
                    should(response.body.code).be.equal(200);
                    should(response.body.data.length).be.equal(0);
                    done();
                });
        });
    });

    after('stop server', (done) => {
        clout.on('stopped', () => done());
        clout.stop();
    });
});

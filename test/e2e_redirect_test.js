const should = require('should');
const testLib = require('./lib');
const request = testLib.request;

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

    describe('/redirect', () => {
        it('should give 302 /redirect/google', async () => {
            const response = await request({ uri: `/redirect/google`, followRedirect: false });
            should(response.statusCode).be.equal(302);
            should(response.headers.location).be.equal('https://google.com');
        });
    });

    after('stop server', (done) => {
        clout.on('stopped', () => done());
        clout.stop();
    });
});

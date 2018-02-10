const path = require('path');
const should = require('should');
const request = require('request');
const Clout = require('../lib/Clout');

const APPLICATION_DIR = path.resolve(__dirname, './fixed/kitchensink');

describe('API Tests', function () {
    let clout;
    let serverAddress;

    before(() => {
        process.env.PORT = 8420;
        process.env.NODE_ENV = 'test';
        clout = new Clout(APPLICATION_DIR);
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

    it('ping server', (done) => {
        request.get(`${serverAddress}/api/ping`, (error, response, body) => {
            done();
        });
    });

    it('stop server', (done) => {
        clout.on('stopped', () => done());
        clout.stop();
    });
});

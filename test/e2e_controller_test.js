const path = require('path');
const fs = require('fs');
const should = require('should');
const testLib = require('./lib');
const request = testLib.request;
const { merge } = require('lodash');

const SIMPLE_INDEX_HTML = fs.readFileSync(path.join(__dirname, 'fixed/kitchensink/views/simple/index.html')).toString();

describe('e2e Controller Tests', function () {
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

    it('load simple page html', (done) => {
        request('/simple/html')
            .then((response) => {
                should(response.body).be.equal(SIMPLE_INDEX_HTML);
            })
            .then(() => done());
    });

    it('load simple page ejs', (done) => {
        request('/simple/ejs')
            .then((response) => {
                should(response.body).be.equal(SIMPLE_INDEX_HTML.replace('$$pageTitle$$', 'EJS Page Title'));
            })
            .then(() => done());
    });

    it('load simple page hbs', (done) => {
        request('/simple/hbs')
            .then((response) => {
                should(response.body).be.equal(SIMPLE_INDEX_HTML.replace('$$pageTitle$$', 'HBS Page Title'));
            })
            .then(() => done());
    });

    after('stop server', (done) => {
        clout.on('stopped', () => done());
        clout.stop();
    });
});

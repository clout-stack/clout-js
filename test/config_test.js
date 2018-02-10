const should = require('should');
const testLib = require('./lib');

describe('Config Tests', function () {
    it('NODE_ENV=', () => {
        process.env.NODE_ENV = 'cloutFTW';
        let clout = testLib.createInstance();

        should(clout.config).have.property('hello');
        should(clout.config.hello).equal('world');
        should(clout.config.example).equal('dafault');
    });

    it('NODE_ENV=development', () => {
        process.env.NODE_ENV = 'development';
        let clout = testLib.createInstance();

        should(clout.config).have.property('hello');
        should(clout.config.hello).equal('development world');
        should(clout.config.example).equal('development');
    });
});

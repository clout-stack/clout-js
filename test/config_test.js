const path = require('path');
const should = require('should');
const Clout = require('../lib/Clout');

const APPLICATION_DIR = path.resolve(__dirname, './fixed/kitchensink');

describe('Config Tests', function () {
    it('NODE_ENV=', () => {
        process.env.NODE_ENV = 'cloutFTW';
        let clout = require(APPLICATION_DIR);

        should(clout.config).have.property('hello');
        should(clout.config.hello).equal('world');
        should(clout.config.example).equal('dafault');
    });

    it('NODE_ENV=development', () => {
        process.env.NODE_ENV = 'development';
        let clout = new Clout(APPLICATION_DIR);

        should(clout.config).have.property('hello');
        should(clout.config.hello).equal('development world');
        should(clout.config.example).equal('development');
    });
});

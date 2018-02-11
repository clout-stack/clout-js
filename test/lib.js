/*!
 * clout-js
 * Copyright(c) 2018 Muhammad Dadu
 * MIT Licensed
 */
const path = require('path');
const request = require('request');

/**
 * Test Helper Lib
 * @module clout-js/test/lib
 * @example
 * const testLib = require('clout-js/test/lib');
 * let clout = testLib.createInstance('./');
 * clout.on('started', () => {
 *      console.log(testLib.serverAddress);
 *      testLib.request({uri: '/api/test', method: 'get', json: true})
 *          .then((response) => console.log(response.body));
 * });
 */
const lib = module.exports = {
    /**
     * @property { string } applicationDir default clout-js application
     * @property { string } serverAddress http address for clout-js instance
     */
    config: {
        applicationDir: path.resolve(__dirname, './fixed/kitchensink')
    },
    /** clout-js instance */
    cloutInstance: undefined,
    /**
     * create clout-js instance application directory
     * @param {string?} applicationDir
     * @return {objet} clout-js instance
     */
    createInstance(applicationDir) {
        if (lib.cloutInstance) {
            lib.destroyInstance();
        }

        let directory = applicationDir || lib.config.applicationDir;
        lib.cloutInstance = require(directory);

        lib.cloutInstance.on('started', () => {
            let server = lib.cloutInstance.server['http'];
            if (server) {
                let port = server.address().port;
                lib.config.serverAddress = `http://localhost:${port}`;
            }
        });

        return lib.cloutInstance;
    },
    /** destroy all clout-js instances */
    destroyInstance() {
        Object.keys(require.cache)
            .filter((dir) => /[(clout\-js\/index)|(fixed\/kitchensink)]/.test(dir))
            .forEach((dir) => delete require.cache[dir]);
    },
    /**
     * generates url for APIs
     * @param {string} path 
     * @return {string}
     */
    createhttpUrl(path) {
        return lib.config.serverAddress + path;
    },
    /**
     * wrapps request in promise and replaces urls with clout-js instance
     * @param {array} args
     * @returns {promise}
     */
    request(...args) {
        return new Promise((resolve, reject) => {
            if (typeof args[0] === 'string') {
                args[0] = lib.createhttpUrl(args[0]);
            } else if (typeof args[0] === 'object') {
                ['url', 'uri'].forEach((key) => {
                    if (args[0][key]) {
                        args[0][key] = lib.createhttpUrl(args[0][key]);
                    }
                });
            }

            if (typeof args[args.length] !== 'function') {
                args.push(function (error, response, body) {
                    if (error) {
                        return reject(error);
                    }

                    resolve(response);
                });
            }

            request(...args);
        });
    }
};

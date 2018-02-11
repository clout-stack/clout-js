/**
 * Test Helper Lib
 */
const path = require('path');
const request = require('request');

const lib = {
    config: {
        applicationDir: path.resolve(__dirname, './fixed/kitchensink')
    },
    cloutInstance: undefined,
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
    destroyInstance() {
        Object.keys(require.cache)
            .filter((dir) => /[(clout\-js\/index)|(fixed\/kitchensink)]/.test(dir))
            .forEach((dir) => delete require.cache[dir]);
    },
    createhttpUrl(path) {
        return lib.config.serverAddress + path;
    },
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

module.exports = lib;
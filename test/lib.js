/**
 * Test Helper Lib
 */
const path = require('path');

module.exports = {
    config: {
        applicationDir: path.resolve(__dirname, './fixed/kitchensink')
    },
    cloutInstance: undefined,
    createInstance(applicationDir) {
        if (this.cloutInstance) {
            this.destroyInstance();
        }

        let directory = applicationDir || this.config.applicationDir;
        this.cloutInstance = require(directory);

        return this.cloutInstance;
    },
    destroyInstance() {
        Object.keys(require.cache)
            .filter((dir) => /[(clout\-js\/index)|(fixed\/kitchensink)]/.test(dir))
            .forEach((dir) => delete require.cache[dir]);
    }
};

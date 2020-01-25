/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const path = require('path');
const Clout = require('./lib/Clout');

let applicationDir;

if (process.env.APPLICATION_DIR) {
  applicationDir = process.env.APPLICATION_DIR;
} else if (module && module.parent) {
  applicationDir = path.dirname(module.parent.filename);
}

/**
 * Root application directory
 * @type {path}
 * @return directory that called module first
 */
if (!applicationDir) {
  throw new Error('application not found');
}

module.exports = new Clout(applicationDir);
module.exports.utils = require('./lib/utils');

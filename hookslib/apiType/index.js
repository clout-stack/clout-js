const path = require('path');
const { getGlobbedFiles } = require('../../lib/utils');

module.exports = {};

function getApiTypes() {
  const apiTypeGlob = path.resolve(__dirname, './**/*.js');
  const apiTypeFilePaths = getGlobbedFiles(apiTypeGlob);
  return apiTypeFilePaths.reduce((acc, filePath) => {
    const { name } = path.parse(filePath);

    acc[name] = require(filePath);

    return acc;
  }, module.exports);
}

getApiTypes();

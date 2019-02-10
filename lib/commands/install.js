/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */

const _ = require('lodash');
const debug = require('debug')('clout:install');
const path = require('path');
const async = require('async');
const fs = require('fs-extra');
const {exec} = require('child_process');

module.exports = {
  command: 'install',
  desc: 'install a clout module',
  options: [
    ['--name', 'service name:'],
    ['--projectDir', 'Project Directory'],
    ['--workspaceDir', 'Workspace Directory'],
    ['--module', 'Workspace Directory (required)'],
  ],
  required: [
    {
      description: 'Module Name:',
      option: 'module',
      name: 'module',
      required: true,
    },
  ],
  action(argv) {
    const serviceName = argv.param('name');
    const serviceId = serviceName && serviceName.replace(' ', '-').toLowerCase();
    const moduleName = argv.param('module');
    let pkg = {};
    const cloutPkg = {};
    let projectDir;

    debug('serviceName: %s', serviceName);
    debug('serviceId: %s', serviceId);
    // get projectDirectory
    if (argv.param('projectDir')) {
      projectDir = path.resolve(projectDir);
    } else if (argv.param('workspaceDir')) {
      projectDir = path.join(argv.param('workspaceDir'), serviceId);
    } else {
      if (serviceId) {
        projectDir = path.join(process.cwd(), serviceId);
      }

      if (!serviceId || !fs.existsSync(projectDir)) {
        projectDir = process.cwd();
      }
    }

    debug('projectDir: %s', projectDir);

    async.series([
      // check if project already exists
      function checkIfProjectExists(next) {
        debug('projectDir exists? %s', fs.existsSync(projectDir));
        if (!fs.existsSync(projectDir)) {
          return next('Project does not exist');
        }
        return next();
      },
      // install module
      function (next) {
        // run npm install
        console.log('Installing project dependencies');
        exec(`cd "${projectDir}" && npm install ${moduleName} --save`, (error, stdout, stderr) => {
          next();
        });
      },
      // save module information
      function (next) {
        let pkgPath = path.join(projectDir, 'package.json'),
          cloutPkgPath = path.join(projectDir, 'clout.json');
        // load files
        fs.existsSync(pkgPath) && (pkg = require(pkgPath));
        fs.existsSync(cloutPkgPath) && (pkg = require(cloutPkg));
        if (pkg.modules) {
          // save here
          pkg.modules.push(moduleName);
          fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, '\t'));
          return next();
        }
        !cloutPkg.modules && (cloutPkg.modules = []);
        cloutPkg.modules.push(moduleName);
        fs.writeFileSync(cloutPkgPath, JSON.stringify(cloutPkg, null, '\t'));
        next();
      },
    ], (err) => {
      if (err) {
        return console.error(err.red);
      }
      console.error('Module Installed');
    });
  },
};

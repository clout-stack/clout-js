/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */
const
  _ = require('lodash'),
  debug = require('debug')('clout:new'),
  path = require('path'),
  async = require('async'),
  ejs = require('ejs'),
  utils = require('../utils'),
  fs = require('fs-extra'),
  exec = require('child_process').exec;

const
  TEMPLATES_DIR = path.join(__dirname, '../../resources/templates/'),
  BASE_TEMPLATE = path.join(TEMPLATES_DIR, 'base');

module.exports = {
  command: 'new',
  desc: 'create a new service',
  options: [
    ['--name', 'service name:'],
    ['--template', 'template:'],
    ['--projectDir', 'Project Directory'],
    ['--workspaceDir', 'Workspace Directory'],
    ['-f, --force', 'Force project creation'],
  ],
  required: [
    {
      description: 'Service Name:',
      option: 'name',
      name: 'name',
      required: true,
    },
  ],
  action(argv) {
    let serviceName = argv.param('name'),
      template = argv.param('template') || 'sample',
      serviceId = serviceName.replace(' ', '-').toLowerCase(),
      projectDir;

    debug('serviceName: %s', serviceName);
    debug('serviceId: %s', serviceId);
    // get projectDirectory
    if (argv.param('projectDir')) {
      projectDir = path.resolve(projectDir);
    } else if (argv.param('workspaceDir')) {
      projectDir = path.join(argv.param('workspaceDir'), serviceId);
    } else {
      projectDir = path.join(process.cwd(), serviceId);
    }

    debug('projectDir: %s', projectDir);

    async.series([
      // check if project already exists
      function checkIfProjectExists(next) {
        debug('projectDir exists? %s', fs.existsSync(projectDir));
        if (!fs.existsSync(projectDir)) {
          return next();
        }
        console.warn('Project already exists'.yellow);
        if (argv.mode('force', 'f')) {
          console.warn('Forcing project creation'.yellow);
          return next();
        }
        prompt.get([{
          description: 'Would you like to overide the existing project:',
          option: 'force',
          name: 'force',
        }], (err, result) => {
          if (!result) {
            // probably a SIGKILL
            console.log('');
            return;
          }
          if (!!result.force && ['y', 'Y', 'yes', 'YES', 'true', 'TRUE', 't', 'T'].indexOf(result.force) > -1) {
            // carry on
            return next();
          }
          console.error('Project could not be created :('.red);
        });
        prompt.start();
      },
      // create Project in directory
      function copyBaseProjectAndRender(next) {
        debug('copySync BASE_TEMPLATE: %s -> projectDir', BASE_TEMPLATE);
        fs.copySync(BASE_TEMPLATE, projectDir);
        const EJSData = {
          serviceName,
          serviceId,
          author: 'Muhammad Dadu',
        };
        debug('EJSData: %s', JSON.stringify(EJSData));
        utils.getGlobbedFiles(`${projectDir}/*.ejs`).forEach((filePath) => {
          let file = fs.readFileSync(filePath, 'ascii'),
            rendered = ejs.render(file, EJSData),
            newFilePath = filePath.replace('.ejs', '');
          fs.writeFileSync(newFilePath, rendered);
          fs.removeSync(filePath);
        });
        next();
      },
      function copyTemplate(next) {
        const templateDir = path.join(TEMPLATES_DIR, template);
        if (!fs.existsSync(templateDir)) {
          return next(`Template \`${template}\` not found`);
        }
        fs.copySync(templateDir, projectDir);
        next();
      },
      function (next) {
        const cloutConf_json = {
          nodes: 1,
        };
        fs.writeFileSync(path.join(projectDir, 'clout.json'), JSON.stringify(cloutConf_json, null, '\t'));
        next();
      },
      function (next) {
        // run npm install
        console.log('Installing project dependencies');
        exec(`cd "${projectDir}" && npm install`, (error, stdout, stderr) => {
          next();
        });
      },
    ], (err) => {
      if (err) {
        return console.error(err.red);
      }
      console.error('Project Created');
    });
  },
};

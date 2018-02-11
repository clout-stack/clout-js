Clout Javascript Framework [![Build Status](https://travis-ci.org/clout-stack/clout-js.svg?branch=master)](https://travis-ci.org/clout-stack/clout-js)
===========

## The Vision
Having developed many server-side services using a wide range of enterprise and open-source frameworks, I realized all of them had one thing in common. They all pushed you to use certain technologies in certain ways.

It all came down to going back to the basics and using express to build any project. Each project had slight variations in packages and thus came the concept of clout-js. A de-coupled event based frameworks that allows you to use whatever technology you would like to use. Modules can be packaged up and re-used in different projects. Even the core-modules such as starting the server could be replaced by writing an override.

## Install
```bash
$ npm install clout-js@beta --save
```

## Module Development
These commands should be run in this directory.

### Run tests
```bash
$ npm run test
```

### Create documentation
```bash
$ npm run gendoc
```

### Run application with this instance
```bash
$ APPLICATION_PATH=<clout-js-applcaiton> npm run start
```

## Usage
```node
const clout = require('clout-js');

clout.start();

clout.on('started', () => {
	['https', 'http'].forEach((key) => {
		let server = clout.server[key];
		if (server) {
			let port = server.address().port;
			console.info('%s server started on port %s', key, port);
		}
	});
});

```

## Clout Application Loader default paths
The following folders are default application searchpath.

| Directory     | purpose       									|
| ------------- | :------------------------------------------------ |
| /conf 		| contains configuration w/ support for NODE_ENV 	|
| /apis 		| contains apis for the application 				| [Create API Endpoint](http://clout-stack.github.io/clout-js/tutorial-create-api-endpoint.html)
| /hooks 		| hooks which can be invoked before an api 			|
| /models 		| contains models (native support for sequalize) 	|
| /public 		| public assets folder								|
| /controllers 	| contains controllers for application 				|

## Enviromental Config
```NODE_ENV=development npm run start```

You can load different configuration files depending on the env variables. For example, the usage of ```NODE_ENV=development``` **(default)** would load the following configuration files into the application;
- ```conf/default.js```
- ```conf/**.development.js```
- ```conf/development.js```

Another example is ```NODE_ENV=production``` which would load the following files;
- ```conf/default.js```
- ```conf/**.production.js```
- ```conf/production.js```

## Clout-JS Module List
| package-name | description |
| ------------- | :------- |
| **[clout-redis-session](https://github.com/clout-js-modules/clout-redis-session)** | Clout module to leverage Redis for sessions |
| **[clout-passport](https://github.com/clout-js-modules/clout-passport)** | Clout module to implement passport |
| **[clout-parse](https://github.com/clout-js-modules/clout-parse)** | Parse module |
| **[clout-mongoose](https://github.com/clout-js-modules/clout-mongoose)** | Clout module to leverage mongoose for models |
| **[clout-18n](https://github.com/clout-js-modules/clout-18n)** | Clout module to implement i18n |
| **[clout-socket-io](https://github.com/clout-js-modules/clout-socket-io)** | Clout module to leverage socket.io |
| **[clout-sequelize](https://github.com/clout-js-modules/clout-sequelize)** | Clout module to leverage sequelize for models |
| **[clout-flash](https://github.com/clout-js-modules/clout-flash)** | Flash message middleware module for Clout-JS |
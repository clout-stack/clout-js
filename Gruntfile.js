/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */

module.exports = function(grunt) {
    grunt.initConfig({
        mochaTest: {
            test: {
                src: ['test/*_test.js']
			}
			watch: {
				src: ['test/*_test.js'],
				watch: true,
			}
        },
	    jsdoc : {
	        dist : {
				src: ['bin/**/*.js', 'hooks/**/*.js', 'hookslib/**/*.js', 'lib/**/*.js', 'test/lib.js', 'index.js', 'README.md'],
	            options: {
					tutorials: 'tutorials/',
					destination: 'docs',
					template: './node_modules/minami'
	            }
	        }
	    }
    });

    grunt.loadNpmTasks('grunt-mocha-test');
    grunt.loadNpmTasks('grunt-jsdoc');

	grunt.registerTask('test', 'mochaTest');
	grunt.registerTask('test:watch', 'mochaTest:watch');
	grunt.registerTask('gendoc', ['mochaTest', 'jsdoc']);

	grunt.registerTask('defualt', ['mochaTest', 'jsdoc']);
};

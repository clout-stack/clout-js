/*!
 * clout-js
 * Copyright(c) 2015 - 2016 Muhammad Dadu
 * MIT Licensed
 */

module.exports = function gruntConfig(grunt) {
  grunt.initConfig({
    jsdoc: {
      dist: {
        src: ['bin/**/*.js', 'hooks/**/*.js', 'hookslib/**/*.js', 'lib/**/*.js', 'test/lib.js', 'index.js', 'README.md'],
        options: {
          tutorials: 'tutorials/',
          destination: 'docs',
          template: './node_modules/minami',
        },
      },
    },
  });

  grunt.loadNpmTasks('grunt-jsdoc');
  grunt.registerTask('gendoc', ['jsdoc']);
  grunt.registerTask('defualt', ['jsdoc']);
};

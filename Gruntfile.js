/*
 * grunt-ideploy
 * https://github.com/Vitre/grunt-ideploy
 *
 * Copyright (c) 2014 Vít Mádr
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function (grunt) {

    grunt.initConfig({
        jshint: {
            all: [
                'Gruntfile.js',
                'tasks/*.js',
                '<%= nodeunit.tests %>'
            ],
            options: {
                jshintrc: '.jshintrc'
            }
        },

        clean: {
            tests: ['tmp']
        },

        ideploy: {
            options: {
                rollbacks: 6,
                port: 21
            },
            beta: {
                auth: 'beta',
                rollbacks: 3,
                src: '/',
                target: '/beta'
            },
            www: {
                auth: 'www',
                rollbacks: 10,
                src: '/',
                target: '/www'
            }
        },

        nodeunit: {
            tests: ['test/*_test.js']
        },

        run_grunt: {
            options: {
            },
            ideploy: {
                options: {
                    log: false
                },
                src: ['node_modules/ideploy/Gruntfile.js']
            }
        }

    });

    grunt.loadTasks('tasks');

    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-nodeunit');
    grunt.loadNpmTasks('grunt-run-grunt');

    //---

    grunt.registerTask('test', ['clean', 'ideploy', /*'nodeunit'*/]);
    grunt.registerTask('default', ['jshint', /*'test'*/]);
    grunt.registerTask('beta', [/*'run_grunt:ideploy',*/ 'ideploy:beta']);
    grunt.registerTask('www', [/*'run_grunt:ideploy',*/ 'ideploy:www']);

};

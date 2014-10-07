/*
 * grunt-ideploy
 * https://github.com/Vitre/grunt-ideploy
 *
 * Copyright (c) 2014 Vít Mádr
 * Licensed under the MIT license.
 */

'use strict';

var extend = require('extend');
var fss = require('fs-sync');
var prompt = require('prompt');
var Ideploy = require('ideploy');

module.exports = function (grunt) {

    grunt.registerMultiTask('ideploy', 'Grunt deploy task', function (target) {

        var options = this.options({
            passive: true,
            rollbacks: 3
        });
        var config = grunt.config.get(this.name);

        grunt.log.subhead('Grunt ideploy task init'['grey']);

        // Target config
        var targetConfig = options;
        if (typeof config[this.target] != 'undefined') {
            extend(true, targetConfig, config[this.target]);
        }

        grunt.log.debug('Name:', this.name);
        grunt.log.debug('Options:', JSON.stringify(options, null, 4));
        grunt.log.debug('Target:', this.target, JSON.stringify(targetConfig, null, 4));

        // .ideployignore
        var ignore = fss.read('.ideployignore').toString().split("\r\n").filter(function (i) {
            return i.length > 0;
        });
        grunt.log.debug('.ideployignore:', JSON.stringify(ignore, null, 4));

        // .ideployauth
        var auth = fss.readJSON('.ideployauth');
        grunt.log.debug('.ideployauth:', JSON.stringify(auth, null, 4));

        // Target auth
        var targetAuth = auth[targetConfig.auth];
        grunt.log.debug('Target auth:', JSON.stringify(targetAuth, null, 4));

        // Ideploy options
        var ideployOptions = extend(false, {
            workspace: {
                name: this.target,
                path: process.cwd() + '/.ideploy/workspace/' + this.target
            },
            debug: grunt.option('debug'),
            verbose: grunt.option('verbose')
        }, targetConfig, targetAuth);
        grunt.log.debug('Ideploy options:', JSON.stringify(ideployOptions, null, 4));

        var done = this.async();

        // Ideploy init
        var ideploy = new Ideploy(ideployOptions);
        ideploy.setDoneHandler(done)

        if (ideploy.isValid()) {

            // Ideploy proceed
            ideploy.deploy();
        } else {
            grunt.log.error('Invalid options.'['red'], JSON.stringify(ideploy.errors, null, 4));
        }
    });

};

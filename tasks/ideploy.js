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
var JSFtp = require('jsftp');
var Ftp = require('ftp');
var prompt = require('prompt');

var c;

var IDeploy = function (options) {

    this.options = {
        host: null,
        username: null,
        password: null,
        port: 21,
        src: null,
        target: null
    };

    this.log = {
        items: [],
        files: [],
        folders: []
    };

    this.ftp = false;

    this.init = function (options) {
        this.options = options;
    };

    this.validate = function () {
        var errors = [];
        if (typeof this.options.host == 'undefined' || this.options.host.length == 0) {
            errors.push('Undefined host');
        }
        if (typeof this.options.username == 'undefined' || this.options.username.length == 0) {
            errors.push('Undefined username');
        }
        if (typeof this.options.password == 'undefined' || this.options.password.length == 0) {
            errors.push('Undefined password');
        }
        if (typeof this.options.port == 'undefined' || this.options.port.length == 0) {
            errors.push('Undefined port');
        }
        return errors;
    }

    this.isValid = function () {
        this.errors = this.validate();
        return this.errors.length === 0;
    }

    this.begin = function () {
        this.connectFtp();
    };

    this.end = function () {

    };

    this.deploy = function () {
        this.begin();
        this.end();
    };

    this.connectFtp = function () {
        this.ftp = c = new Ftp();

        var options = {
            host: this.options.host,
            port: this.options.port || 21,
            user: this.options.username,
            pass: this.options.password
        };

        c.on('ready', function () {
            console.log('FTP ready');
            c.list('.', function (list, err) {
                if (err) throw err;
                console.log(list);
                c.end();
            });
        });

        console.log('FTP connect', options);
        c.connect(options);

    };

    this.connectSftp = function () {

        var options = {
            host: this.options.host,
            port: this.options.port || 21,
            user: this.options.username,
            pass: this.options.password,
            debugMode: true
        };

        console.info('JSFtp connecting...', JSON.stringify(options, null, 2))

        this.ftp = new JSFtp(options);

        console.log(this.ftp);

        this.ftp.on('jsftp_debug', function (eventType, data) {
            console.log('DEBUG: ', eventType);
            console.log(JSON.stringify(data, null, 2));
        });

        this.ftp.on('error', function (err) {
            console.error(err.code);
        });

        console.info('JSFtp auth...', this.options.username, this.options.password);

        this.ftp.auth(this.options.username, this.options.password, function (err, data) {
            console.info(this.ftp.system);

            this.ftp.list('/', function (err, res) {
                res.forEach(function (file) {
                    console.log(file.name);
                });
            });

        });

        this.ftp.ls('.', function (err, res) {
            res.forEach(function (file) {
                console.log(file.name);
            });
        });

    };

    this.init(options);
};

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
        var ideployOptions = extend(false, {}, targetConfig, targetAuth);
        grunt.log.debug('Ideploy options:', JSON.stringify(ideployOptions, null, 4));

        // Ideploy init
        var ideploy = new IDeploy(ideployOptions);

        if (ideploy.isValid()) {

            // Ideploy proceed
            ideploy.deploy();
        } else {
            grunt.log.error('Invalid options.'['red'], JSON.stringify(ideploy.errors, null, 4));
        }
    });

};

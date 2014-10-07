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

/**
 * Ideploy namespace
 *
 * @type {{}}
 */
var Ideploy = {};

/**
 * Ideploy workspace object
 *
 * @param options
 * @constructor
 */
Ideploy.Workspace = function (options) {

    /**
     * Workspace options
     * @type {{name: string, path: null}}
     */
    this.options = {
        name: 'unnamed',
        path: null
    };

    /**
     * Workspace name
     */
    this.name;

    /**
     * FS path
     */
    this.path;

    /**
     * Instance init
     *
     * @param options
     * @private
     */
    this.__initInstance = function (options) {
        this.options = options;

        this.name = this.options.name;
        this.path = this.options.path;
    };

    /**
     * Workspace init
     */
    this.init = function() {
        console.log('Workspace init.', this.name, this.path);
        if (!fss.isDir(this.path)) {
            console.log('Creating workspace dir.', this.name, this.path);
            fss.mkdir(this.path);
        }
    };

    this.__initInstance(options);
};

/**
 * Ideploy client object
 *
 * @param options
 * @constructor
 */
Ideploy.Client = function (options) {

    /**
     * Options
     *
     * @type {{}}
     */
    this.options = {
        host: null,
        username: null,
        password: null,
        port: 21,
        src: null,
        target: null,
        verbose: false,
        debug: false,
        workspace: '.ideploy'
    };

    /**
     * Log storage
     *
     * @type {{items: Array, files: Array, folders: Array}}
     */
    this.log = {
        items: [],
        files: [],
        folders: []
    };

    /**
     * Client instance
     *
     * @type {object}
     */
    this.ftp;

    /**
     * Verbose flag
     *
     * @type {boolean}
     */
    this.verbose = false;

    /**
     * Debug flag
     * @type {boolean}
     */
    this.debug = false;

    /**
     * Local CWD
     *
     * @type {string}
     */
    this.lcwd;

    /**
     * Remote CWD
     *
     * @type {string}
     */
    this.rcwd;

    /**
     * Async done handler
     */
    this.doneHandler = function () {
    };

    /**
     * Workspace object
     *
     * @type {object}
     */
    this.workspace;

    /**
     * Init instance
     * @param options
     */
    this.__initInstance = function (options) {
        this.options = options;

        // CLI
        if (typeof this.options.debug != 'undefined') {
            this.debug = this.options.debug;
        }

        if (typeof this.options.verbose != 'undefined') {
            this.verbose = this.options.verbose;
        }

        // Workspace
        this.initWorkspace(this.options.workspace || '.ideploy');

    };

    this.initWorkspace = function (workspace) {
        this.workspace = new Ideploy.Workspace({
            name: workspace.name,
            path: workspace.path
        });
        this.workspace.init();
    };

    /**
     * Options validator
     *
     * @returns {Array}
     */
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
    };

    /**
     * Options validation getter
     *
     * @returns {boolean}
     */
    this.isValid = function () {
        this.errors = this.validate();
        return this.errors.length === 0;
    }

    /**
     * Begin event
     */
    this.begin = function () {
        this.connectSftp();
    };

    /**
     * End event
     */
    this.end = function () {

    };

    /**
     * Done setter
     *
     * @param value
     */
    this.setDone = function (value) {
        this.doneHandler(true);
    };

    /**
     * Deploy call
     */
    this.deploy = function () {
        this.begin();
        this.end();
    };

    /**
     * Client connector
     */
    this.connectSftp = function () {

        var options = {
            host: this.options.host,
            port: this.options.port || 21,
            user: this.options.username,
            pass: this.options.password,
            debugMode: this.debug
        };

        console.info('JSFtp connecting...', JSON.stringify(options, null, 2))

        this.ftp = c = new JSFtp(options);

        if (this.verbose) {
            this.ftp.on('jsftp_debug', function (eventType, data) {
                console.log('DEBUG: ', eventType);
                console.log(JSON.stringify(data, null, 2));
            });
        }

        this.ftp.on('error', function (err) {
            console.error(err.code);
        });

        console.info('JSFtp auth...', this.options.username + ':' + this.options.password);

        this.ftp.auth(this.options.username, this.options.password, function (err, data) {
            console.info('JSFtp auth successful'['green']);

            c.ls('.', function (err, res) {
                res.forEach(function (file) {
                    console.log(file.name);
                });
            });

        });


    };

    /**
     * Done handler setter
     *
     * @param handler
     */
    this.setDoneHandler = function (handler) {
        this.doneHandler = handler;
    };

    this.__initInstance(options);
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
        var ideploy = new Ideploy.Client(ideployOptions);
        ideploy.setDoneHandler(done)

        if (ideploy.isValid()) {

            // Ideploy proceed
            ideploy.deploy();
        } else {
            grunt.log.error('Invalid options.'['red'], JSON.stringify(ideploy.errors, null, 4));
        }
    });

};

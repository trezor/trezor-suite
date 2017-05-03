// Karma configuration
// Generated on Wed Apr 12 2017 14:04:18 GMT+0200 (CEST)

module.exports = function (config) {
    config.set({

        // base path that will be used to resolve all patterns (eg. files, exclude)
        basePath: '',

        // frameworks to use
        // available frameworks: https://npmjs.org/browse/keyword/karma-adapter
        frameworks: ['browserify', 'mocha'],

        browserify: {
            debug: true,
            transform: [
                ['babelify', {
                    'presets': [
                        'es2015',
                    ],
                    'plugins': [
                        'transform-flow-strip-types',
                        'transform-class-properties',
                        'transform-object-rest-spread',
                        'add-module-exports',
                    ],
                }],
                ['workerify'],
                ['browserify-shim'],
            ],
        },

        // list of files / patterns to load in the browser
        files: [
            'test/bitcore.js',
            'test/discovery.js',
        ],

        // list of files to exclude
        exclude: [
        ],

        // preprocess matching files before serving them to the browser
        // available preprocessors: https://npmjs.org/browse/keyword/karma-preprocessor
        preprocessors: {
            'test/bitcore.js': [ 'browserify' ],
            'test/discovery.js': [ 'browserify' ],
        },

        // test results reporter to use
        // possible values: 'dots', 'progress'
        // available reporters: https://npmjs.org/browse/keyword/karma-reporter
        reporters: ['dots'],

        browserNoActivityTimeout: 60 * 1000,

        // web server port
        port: 9876,

        // enable / disable colors in the output (reporters and logs)
        colors: true,

        // level of logging
        // possible values: config.LOG_DISABLE || config.LOG_ERROR || config.LOG_WARN || config.LOG_INFO || config.LOG_DEBUG
        logLevel: config.LOG_INFO,

        // enable / disable watching file and executing tests whenever any file changes
        autoWatch: false,

        // start these browsers
        // available browser launchers: https://npmjs.org/browse/keyword/karma-launcher
        browsers: ['Chrome', 'Firefox'],

        // Continuous Integration mode
        // if true, Karma captures browsers, runs the tests and exits
        singleRun: false,

        // Concurrency level
        // how many browser should be started simultaneous
        concurrency: Infinity,
    });
};

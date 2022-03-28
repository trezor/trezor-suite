const path = require('path');
const webpack = require('webpack');

// karma doesn't have support of filter by filename pattern.
// create custom filter from the arguments to have same behavior in jest and karma.
// assuming that tests are triggered by `yarn test:karma:production filename1 filename2 ...` command
const getTestPattern = () => {
    const basename = __filename.split('/').reverse()[0];
    // yarn test:karma:production ...pattern => argv: [node, karma, start, config-file, ...pattern]
    const pos = process.argv.indexOf(basename);
    if (pos > 0) {
        return process.argv.slice(pos + 1).map(f => `./tests/**/${f}.test.js`);
    }

    return ['./tests/**/*.test.js'];
};

module.exports = config => {
    config.set({
        hostname: 'localhost',
        port: 8099,
        autoWatch: false,
        singleRun: true,

        client: {
            captureConsole: true,
            clearContext: true,
            useIframe: false,
            runInParent: true,
        },
        // browsers: ['Chrome'],
        browsers: ['ChromeHeadlessNoSandbox'],
        customLaunchers: {
            ChromeHeadlessNoSandbox: {
                base: 'ChromeHeadless',
                flags: ['--no-sandbox'],
            },
        },
        concurrency: 0,
        browserNoActivityTimeout: 6000000,
        colors: true,
        logLevel: config.LOG_DEBUG,

        // include custom karma.plugin
        plugins: ['karma-*', path.resolve(__dirname, './karma.plugin.js')],
        frameworks: ['jasmine', 'webpack', 'WebsocketServer'], // use custom framework from karma.plugin
        preprocessors: {
            './karma.setup.js': 'webpack',
            './common.setup.js': 'webpack',
            './__txcache__/index.js': 'TxCachePreprocessor', // use custom preprocessor from karma.plugin
            // // todo
            './data/coins.json': 'WsCachePreprocessor', // use custom preprocessor from karma.plugin
            './**/*.test.js': 'webpack',
        },
        files: [
            { pattern: './karma.setup.js', watched: false },
            { pattern: './common.setup.js', watched: false },
            { pattern: './__txcache__/index.js', watched: false },
            {
                pattern: './build/**/*.*',
                watched: false,
                included: false,
                served: true,
                nocache: false,
            },
        ].concat(getTestPattern()),

        webpackMiddleware: {
            stats: 'errors-only',
        },
        webpack: {
            module: {
                rules: [
                    // todo: probably should not be needed
                    {
                        test: /\.js?$/,
                        exclude: /node_modules/,
                        use: ['babel-loader'],
                    },
                    {
                        test: /\.ts?$/,
                        exclude: /ts_modules/,
                        use: ['babel-loader'],
                    },
                ],
            },
            plugins: [
                // provide fallback plugins, Buffer and process are used in fixtures
                new webpack.ProvidePlugin({
                    Buffer: ['buffer', 'Buffer'],
                    process: 'process/browser',
                }),
                // replace TrezorConnect module used in ./tests/common.setup.js
                new webpack.NormalModuleReplacementPlugin(
                    /src\/js\/index$/,
                    path.join(__dirname, 'build/trezor-connect'),
                ),
                // replace ws module used in ./tests/websocket-client.js
                new webpack.NormalModuleReplacementPlugin(
                    /ws$/,
                    '@trezor/blockchain-link/lib/utils/ws',
                ),

                new webpack.DefinePlugin({
                    // set custom connect endpoint to build directory
                    'process.env.TREZOR_CONNECT_SRC': JSON.stringify(
                        'http://localhost:8099/base/build/',
                    ),
                    // pass required process.env variables
                    'process.env.TESTS_FIRMWARE': JSON.stringify(process.env.TESTS_FIRMWARE),
                    'process.env.TESTS_INCLUDED_METHODS': JSON.stringify(
                        process.env.TESTS_INCLUDED_METHODS,
                    ),
                    'process.env.TESTS_TESTS_EXCLUDED_METHODS': JSON.stringify(
                        process.env.TESTS_EXCLUDED_METHODS,
                    ),
                    'process.env.TESTS_USE_TX_CACHE': JSON.stringify(
                        process.env.TESTS_USE_TX_CACHE,
                    ),
                    'process.env.TESTS_USE_WS_CACHE': JSON.stringify(
                        process.env.TESTS_USE_WS_CACHE,
                    ),
                }),
            ],
        },
        // reporters: [ 'CustomReporter'], // use custom reporter from karma.plugin

        // reporters: ['progress', 'coverage', 'CustomReporter'], // use custom reporter from karma.plugin
        coverageReporter: {
            dir: 'coverage',
            reporters: [
                {
                    type: 'html',
                    subdir: 'report-html',
                },
            ],
            instrumenterOptions: {
                istanbul: {
                    noCompact: true,
                },
            },
        },
    });
};

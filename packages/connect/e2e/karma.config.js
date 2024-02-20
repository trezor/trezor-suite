const path = require('path');
const webpack = require('webpack');

// karma doesn't have support of filter by filename pattern.
// create custom filter from the arguments to have the same behavior in jest and karma.
// assuming that tests are triggered by `yarn test:karma:production filename1 filename2 ...` command
const getTestPattern = () => {
    const root = path.resolve(__dirname, './tests');
    const basename = __filename.split('/').reverse()[0];
    const pos = process.argv.indexOf(`e2e/${basename}`);
    if (process.argv[pos + 1]) {
        // if yes add full path
        return process.argv.slice(pos + 1).map(f => `${root}/**/${f}.test.ts`);
    }

    // else return all glob patter for all tests
    return [`${root}/**/*.test.ts`];
};

module.exports = config => {
    config.set({
        basePath: path.resolve(__dirname, '../..'), // NOTE: "[monorepo-root]/packages", to have access to other packages
        hostname: 'localhost',
        port: 8099,
        autoWatch: false,
        // to debug locally set single run to false and go to http://localhost:8099/debug.html
        // for local changes to take effect build connect-iframe and connect-web
        singleRun: true,

        client: {
            captureConsole: true,
            clearContext: true,
            useIframe: false,
            runInParent: true,
            mocha: {
                bail: true,
            },
            // uncomment to disable random ordering of tests
            // jasmine: {
            //     random: false,
            // },
        },
        browserConsoleLogOptions: {
            terminal: true,
            level: '',
        },
        browsers: [
            // 'Chrome',
            'ChromeHeadlessNoSandbox',
        ],
        customLaunchers: {
            ChromeHeadlessNoSandbox: {
                base: 'ChromeHeadless',
                flags: ['--no-sandbox'],
            },
            Chrome: {
                base: 'Chrome',
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
            '**/karma.setup.js': 'webpack',
            '**/common.setup.js': 'webpack',
            '**/__txcache__/index.js': 'TxCachePreprocessor', // use custom preprocessor from karma.plugin
            '**/data/coins.json': 'WsCachePreprocessor', // use custom preprocessor from karma.plugin
            'connect/e2e/**/*.test.ts': 'webpack',
        },
        files: [
            { pattern: path.resolve(__dirname, './karma.setup.js'), watched: false },
            { pattern: path.resolve(__dirname, './common.setup.js'), watched: false },
            { pattern: path.resolve(__dirname, './__txcache__/index.js'), watched: false },
            {
                pattern: './connect-iframe/build/**/*.*',
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
                    {
                        test: /\.ts?$/,
                        exclude: /node_modules/,
                        use: [
                            {
                                loader: 'babel-loader',
                                options: {
                                    presets: ['@babel/preset-typescript'],
                                },
                            },
                        ],
                    },
                ],
            },
            resolve: {
                modules: ['node_modules'],
                extensions: ['.ts', '.js'],
            },
            plugins: [
                // provide fallback plugins, Buffer and process are used in fixtures
                new webpack.ProvidePlugin({
                    Buffer: ['buffer', 'Buffer'],
                    process: 'process/browser',
                }),
                // replace TrezorConnect module used in ./tests/common.setup.js
                new webpack.NormalModuleReplacementPlugin(
                    /^(\.\.\/)+src$/,
                    path.join(__dirname, '../../connect-web/build/trezor-connect.js'),
                ),

                // replace ws module used in ./tests/websocket-client.js
                new webpack.NormalModuleReplacementPlugin(
                    /ws$/,
                    '@trezor/blockchain-link/lib/utils/ws',
                ),

                new webpack.DefinePlugin({
                    // set custom connect endpoint to build directory
                    'process.env.TREZOR_CONNECT_SRC': JSON.stringify(
                        'http://localhost:8099/base/connect-iframe/build/',
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
        reporters: ['CustomReporter'], // use custom reporter from karma.plugin
    });
};

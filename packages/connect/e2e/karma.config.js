const path = require('path');
const webpack = require('webpack');

module.exports = config => {
    const singleRun = process.env.KARMA_SINGLE_RUN === 'false' ? false : true;

    config.set({
        basePath: path.resolve(__dirname, '../..'), // NOTE: "[monorepo-root]/packages", to have access to other packages
        hostname: 'localhost',
        port: 8099,
        autoWatch: false,
        singleRun,

        client: {
            captureConsole: true,
            clearContext: true,
            useIframe: false,
            runInParent: true,
            // uncomment to disable random ordering of tests
            jasmine: {
                random: false,
            },
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
            '**/common.setup.ts': 'webpack',

            '**/__txcache__/index.js': 'TxCachePreprocessor', // use custom preprocessor from karma.plugin
            '**/data/coins.json': 'WsCachePreprocessor', // use custom preprocessor from karma.plugin
            'connect/e2e/**/*.test.ts': 'webpack',
        },
        files: [
            { pattern: path.resolve(__dirname, './karma.setup.js'), watched: false },
            { pattern: path.resolve(__dirname, './common.setup.js'), watched: false },
            { pattern: path.resolve(__dirname, './common.setup.ts'), watched: false },

            { pattern: path.resolve(__dirname, './__txcache__/index.js'), watched: false },
            {
                pattern: './connect-iframe/build/**/*.*',
                watched: false,
                included: false,
                served: true,
                nocache: false,
            },
            ...(process.env.TESTS_PATTERN || '*')
                .split(' ')
                .map(pattern => path.resolve(__dirname, `./tests/**/${pattern.trim()}*.ts`)),
        ],

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
                    '@trezor/blockchain-link/src/utils/ws',
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

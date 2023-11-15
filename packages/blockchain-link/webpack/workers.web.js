const webpack = require('webpack');
const { SRC, BUILD } = require('./constants');

module.exports = {
    target: 'webworker',
    mode: 'production',
    entry: {
        'ripple-worker': `${SRC}workers/ripple/index.ts`,
        'blockbook-worker': `${SRC}workers/blockbook/index.ts`,
        'blockfrost-worker': `${SRC}workers/blockfrost/index.ts`,
        'solana-worker': `${SRC}workers/solana/index.ts`,
    },
    output: {
        filename: '[name].js',
        path: `${BUILD}web/`,
        publicPath: './',
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
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
        modules: [SRC, 'node_modules'],
        extensions: ['.ts', '.js'],
        mainFields: ['main', 'module'], // prevent wrapping default exports by harmony export (bignumber.js in ripple issue)
        fallback: {
            https: false, // required by ripple-lib
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
        },
    },
    performance: {
        hints: false,
    },
    optimization: {
        minimize: false,
    },
    plugins: [new webpack.NormalModuleReplacementPlugin(/^ws$/, `${SRC}/utils/ws`)],
};

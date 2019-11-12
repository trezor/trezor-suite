import webpack from 'webpack';
import { SRC, BUILD } from './constants';

module.exports = {
    mode: 'production',
    entry: {
        'blockbook-worker': `${SRC}workers/blockbook/index.ts`,
        'ripple-worker': `${SRC}workers/ripple/index.ts`,
    },
    output: {
        filename: '[name].js',
        path: `${BUILD}module/`,
        publicPath: './',
        library: 'BlockchainLinkWorker',
        libraryTarget: 'umd',
        libraryExport: 'default',
    },
    module: {
        rules: [
            {
                test: [/blockbook\/index.ts?$/, /ripple\/index.ts?$/],
                exclude: /node_modules/,
                use: ['module-worker-loader'],
            },
            {
                test: /\.ts?$/,
                exclude: /node_modules/,
                use: ['ts-loader'],
            },
            {
                test: /\.js?$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
        ],
    },
    resolve: {
        modules: [SRC, 'node_modules'],
        extensions: ['.ts', '.js'],
        alias: {
            'ws-browser': `${SRC}/utils/ws.js`,
        },
    },
    resolveLoader: {
        modules: ['node_modules'],
        alias: {
            'module-worker-loader': `${__dirname}/module-worker-loader.js`,
        },
    },
    performance: {
        hints: false,
    },
    // plugins: [new webpack.NormalModuleReplacementPlugin(/^ws$/, 'ws-browser')],

    optimization: {
        minimize: false,
    },
};

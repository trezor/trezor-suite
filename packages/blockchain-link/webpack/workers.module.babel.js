import webpack from 'webpack';
import { SRC, BUILD } from './constants';

module.exports = {
    target: 'node',
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
                test: [/workers.*\/index.ts$/],
                exclude: /node_modules/,
                use: ['module-worker-loader'],
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: { configFile: 'tsconfig.lib.json' },
                    },
                ],
            },
        ],
    },
    resolve: {
        modules: [SRC, 'node_modules'],
        extensions: ['.ts', '.js'],
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
    // ignore those modules, otherwise webpack throws warning about missing (ws dependency)
    externals: ['utf-8-validate', 'bufferutil'],

    optimization: {
        minimize: false,
    },
};

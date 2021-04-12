import webpack from 'webpack';
import { SRC, BUILD } from './constants';

module.exports = {
    target: 'web',
    mode: 'production',
    entry: {
        'blockbook-worker': `${SRC}workers/blockbook/index.ts`,
        'ripple-worker': `${SRC}workers/ripple/index.ts`,
        'blockfrost-worker': `${SRC}workers/blockfrost/index.ts`,
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
        alias: {
            'ws-browser': `${SRC}/utils/ws.js`,
        },
        fallback: {
            https: false, // required by ripple-lib
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
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
    plugins: [new webpack.NormalModuleReplacementPlugin(/^ws$/, 'ws-browser')],
    optimization: {
        minimize: false,
    },
};

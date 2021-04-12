import webpack from 'webpack';
import { SRC, BUILD } from './constants';

module.exports = {
    target: 'webworker',
    mode: 'production',
    entry: {
        'ripple-worker': `${SRC}workers/ripple/index.ts`,
        'blockbook-worker': `${SRC}workers/blockbook/index.ts`,
        'blockfrost-worker': `${SRC}workers/blockfrost/index.ts`,
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
                        loader: 'ts-loader',
                        options: { configFile: 'tsconfig.workers.json' },
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
    performance: {
        hints: false,
    },
    plugins: [new webpack.NormalModuleReplacementPlugin(/^ws$/, 'ws-browser')],
};

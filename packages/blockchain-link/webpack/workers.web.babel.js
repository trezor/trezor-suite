import webpack from 'webpack';
import { SRC, BUILD } from './constants';

module.exports = {
    mode: 'production',
    entry: {
        'ripple-worker': `${SRC}workers/ripple/index.ts`,
        'blockbook-worker': `${SRC}workers/blockbook/index.ts`,
    },
    output: {
        filename: '[name].js',
        path: `${BUILD}web/`,
        publicPath: './',
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: { configFile: 'tsconfig.workers.json' },
                    },
                ],
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
    performance: {
        hints: false,
    },
    plugins: [new webpack.NormalModuleReplacementPlugin(/^ws$/, 'ws-browser')],

    // optimization: {
    //     minimize: false,
    // },

    // ignoring Node.js import in fastxpub (hd-wallet)
    // node: {
    //     fs: 'empty',
    //     net: 'empty',
    //     tls: 'empty',
    //     path: 'empty',
    // },
};

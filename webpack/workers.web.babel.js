// eslint-disable-next-line import/no-extraneous-dependencies
import webpack from 'webpack';
import { SRC, BUILD } from './constants';

module.exports = {
    mode: 'production',
    entry: {
        'ripple-worker': `${SRC}workers/ripple/index.js`,
        'blockbook-worker': `${SRC}workers/blockbook/index.js`,
    },
    output: {
        filename: '[name].js',
        path: `${BUILD}web/`,
        publicPath: './',
    },
    module: {
        rules: [
            {
                test: /\.js?$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
        ],
    },
    resolve: {
        modules: [SRC, 'node_modules'],
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

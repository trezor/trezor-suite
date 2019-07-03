import { SRC, BUILD } from './constants';

// import webpack from 'webpack';
// import UglifyJsPlugin from 'uglifyjs-webpack-plugin';

module.exports = {
    mode: 'production',
    target: 'node',
    entry: {
        'ripple-worker': `${SRC}workers/ripple/index.ts`,
        'blockbook-worker': `${SRC}workers/blockbook/index.ts`,
    },
    output: {
        filename: '[name].js',
        path: `${BUILD}node/`,
        publicPath: './',
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                exclude: /node_modules/,
                use: ['ts-loader'],
            },
        ],
    },
    resolve: {
        modules: [SRC, 'node_modules'],
        extensions: ['.ts', '.js'],
        alias: {},
    },
    performance: {
        hints: false,
    },
    plugins: [],

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

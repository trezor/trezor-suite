import { SRC, BUILD } from './constants';

// import webpack from 'webpack';
// import UglifyJsPlugin from 'uglifyjs-webpack-plugin';

module.exports = {
    mode: 'production',
    target: 'node',
    entry: {
        'ripple-worker': `${SRC}workers/ripple/index.js`,
        'blockbook-worker': `${SRC}workers/blockbook/index.js`,
    },
    output: {
        filename: '[name].js',
        path: `${BUILD}node/`,
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

import {
    SRC,
    BUILD,
    LIB_NAME,
} from './constants';

import webpack from 'webpack';
import UglifyJsPlugin from 'uglifyjs-webpack-plugin';

module.exports = {
    mode: 'production',
    entry: {
        'ripple-worker': `${SRC}workers/ripple/index.js`,
        'blockbook-worker': `${SRC}workers/blockbook/index.js`,
    },
    output: {
        filename: '[name].js',
        path: `${BUILD}workers/`,
        publicPath: './',
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                type: 'javascript/auto',
                test: /\.wasm$/,
                loader: 'file-loader',
                query: {
                    name: 'js/[name].[hash].[ext]',
                },
            },
            {
                type: 'javascript/auto',
                test: /\.json/,
                exclude: /node_modules/,
                loader: 'file-loader',
                query: {
                    outputPath: './data',
                    name: '[name].[hash].[ext]',
                },
            },
        ]
    },
    resolve: {
        modules: [ SRC, 'node_modules' ],
        alias: {

        }
    },
    performance: {
        hints: false
    },
    plugins: [

    ],

    // bitcoinjs-lib NOTE:
    // When uglifying the javascript, you must exclude the following variable names from being mangled:
    // Array, BigInteger, Boolean, ECPair, Function, Number, Point and Script.
    // This is because of the function-name-duck-typing used in typeforce.
    // optimization: {
    //     minimizer: [
    //         new UglifyJsPlugin({
    //             parallel: true,
    //             uglifyOptions: {
    //                 compress: {
    //                     warnings: false,
    //                 },
    //                 mangle: {
    //                     reserved: [
    //                         'Array', 'BigInteger', 'Boolean', 'Buffer',
    //                         'ECPair', 'Function', 'Number', 'Point', 'Script',
    //                     ],
    //                 }
    //             }
    //         })
    //     ]
    // },
    optimization: {
        minimize: false
    },



    // ignoring Node.js import in fastxpub (hd-wallet)
    node: {
        fs: "empty",
        net: "empty",
        tls: "empty",
        path: "empty",
    }
}

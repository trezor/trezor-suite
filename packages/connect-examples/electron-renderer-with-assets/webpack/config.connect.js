const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const DIST = path.resolve(__dirname, '../assets/trezor-connect');

module.exports = {
    mode: 'production',
    entry: './node_modules/trezor-connect/lib/iframe/iframe.js',
    output: {
        filename: 'js/iframe.[hash].js',
        path: DIST,
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
        modules: ['node_modules'],
    },
    plugins: [
        // fix blake2b import
        new webpack.NormalModuleReplacementPlugin(/.blake2b$/, './blake2b.js'),
        new HtmlWebpackPlugin({
            filename: 'iframe.html',
            template: './webpack/iframe.html',
            inject: false,
        }),
        new CopyWebpackPlugin({
            patterns: [{ from: './node_modules/trezor-connect/data', to: `${DIST}/data` }],
        }),
    ],

    // @trezor/utxo-lib NOTE:
    // When uglifying the javascript, you must exclude the following variable names from being mangled:
    // Array, BigInteger, Boolean, Buffer, ECPair, Function, Number, Point and Script.
    // This is because of the function-name-duck-typing used in typeforce.
    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel: true,
                extractComments: false,
                terserOptions: {
                    ecma: 6,
                    mangle: {
                        reserved: [
                            'Array',
                            'BigInteger',
                            'Boolean',
                            'Buffer',
                            'ECPair',
                            'Function',
                            'Number',
                            'Point',
                            'Script',
                        ],
                    },
                },
            }),
        ],
    },
};

/* eslint-disable @typescript-eslint/no-var-requires */

const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

const path = require('path');

const SRC = '../../node_modules/trezor-connect';
const CONNECT_DATA_SRC = `${SRC}/data`;
const COMMON_DATA_SRC = '../../packages/connect-common/files';
const HTML_SRC = path.resolve(__dirname, '../src/static/iframe.html');
const DIST = path.resolve(__dirname, '../build');

module.exports = {
    mode: 'production',
    entry: {
        iframe: `${SRC}/lib/iframe/iframe.js`,
    },
    output: {
        filename: 'js/[name].[hash].js',
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
        modules: [SRC, 'node_modules'],
    },
    performance: {
        hints: false,
    },
    plugins: [
        new webpack.NormalModuleReplacementPlugin(/.blake2b$/, './blake2b.js'),
        new webpack.NormalModuleReplacementPlugin(/env\/node$/, './env/browser'),
        new webpack.NormalModuleReplacementPlugin(/env\/node\/workers$/, '../env/browser/workers'),
        new webpack.NormalModuleReplacementPlugin(
            /env\/node\/networkUtils$/,
            '../env/browser/networkUtils',
        ),
        new CopyWebpackPlugin({
            patterns: [
                // copy messages, coins, config from 'trezor-connect'
                {
                    from: CONNECT_DATA_SRC,
                    to: `${DIST}/data`,
                    globOptions: {
                        ignore: ['**/bridge/**/*', '**/firmware/**/*'],
                    },
                },
                // copy firmware releases, bridge releases from '@trezor/connect-common'
                { from: COMMON_DATA_SRC, to: `${DIST}/data` },
            ],
        }),
        // ignore Node.js lib from trezor-link
        new webpack.IgnorePlugin(/\/iconv-loader$/),
        new HtmlWebpackPlugin({
            chunks: ['iframe'],
            filename: 'iframe.html',
            template: HTML_SRC,
            minify: false,
            inject: false,
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

    // ignoring Node.js import in fastxpub (hd-wallet)
    node: {
        fs: 'empty',
        path: 'empty',
        net: 'empty',
        tls: 'empty',
    },
};

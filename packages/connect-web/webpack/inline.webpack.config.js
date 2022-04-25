const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

// Generate inline script hosted on https://connect.trezor.io/X/trezor-connect.js
// This is compiled and polyfilled npm package without Core logic

const TREZOR_CONNECT_SRC = path.resolve(__dirname, '../../connect/src');
const DIST = path.resolve(__dirname, '../build/js');
const LIB_NAME = 'TrezorConnect';

module.exports = {
    target: 'web',
    mode: 'production',
    entry: {
        // inline script
        'trezor-connect': path.resolve(__dirname, '../src/index.ts'),
        // webusb
        webusb: path.resolve(__dirname, '../src/webusb/index.ts'),
        extensionPermissions: path.resolve(__dirname, '../src/webusb/extensionPermissions.ts'),
        // webextension
        'trezor-usb-permissions': path.resolve(
            __dirname,
            '../src/webextension/trezor-usb-permissions.ts',
        ),
        'trezor-content-script': path.resolve(
            __dirname,
            '../src/webextension/trezor-content-script.ts',
        ),
    },
    output: {
        path: DIST,
        publicPath: './',
        library: LIB_NAME,
        libraryTarget: 'umd',
        libraryExport: 'default',
    },
    module: {
        rules: [
            {
                test: /\.js?$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
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
        modules: ['node_modules'],
        mainFields: ['browser', 'module', 'main'],
        extensions: ['.ts', '.js'],
    },
    performance: {
        hints: false,
    },
    plugins: [
        // REF-TODO: check inline build in browser, like connect-explorer or codepen
        // REF-TODO: remove unused exports from bundle
        // resolve @trezor/connect imports from "src" instead of "lib"
        // new webpack.NormalModuleReplacementPlugin(/@trezor\/connect/, resource => {
        //     resource.request = resource.request
        //         .replace('@trezor/connect/lib', TREZOR_CONNECT_SRC)
        //         .replace('@trezor/connect', `${TREZOR_CONNECT_SRC}/index-browser.ts`);
        // }),
        new HtmlWebpackPlugin({
            chunks: ['trezor-usb-permissions'],
            filename: 'trezor-usb-permissions.html',
            template: path.join(__dirname, '../src/webextension/trezor-usb-permissions.html'),
            minify: false,
            inject: false,
        }),
    ],
    optimization: {
        emitOnErrors: true,
        moduleIds: 'named',
        minimize: false,
        // todo: minimizer / terser plugin
    },
};

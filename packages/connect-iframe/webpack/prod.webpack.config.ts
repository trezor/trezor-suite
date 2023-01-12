import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

const COMMON_DATA_SRC = '../../packages/connect-common/files';

const DIST = path.resolve(__dirname, '../build');

export default {
    target: 'web',
    mode: 'production',
    entry: {
        iframe: path.resolve(__dirname, '../src/index.ts'),
    },
    output: {
        filename: 'js/[name].[contenthash].js',
        path: DIST,
        publicPath: './',
    },
    module: {
        rules: [
            {
                test: /\.(js|ts)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-typescript'],
                    },
                },
            },
            // {
            //     test: (input: any) => {
            //         // todo: we could use regexp but using function is nice for debugging
            //         if (input.includes('background-sharedworker')) {
            //             return true;
            //         }
            //         return false;
            //     },
            //     loader: 'worker-loader',
            //     options: {
            //         worker: 'SharedWorker',
            //         filename: './workers/sessions-background-sharedworker.[contenthash].js',
            //     },
            // },
            {
                test: /\workers\/blockbook\/index/i,
                loader: 'worker-loader',
                options: {
                    filename: './workers/blockbook-worker.[contenthash].js',
                },
            },
            {
                test: /\workers\/ripple\/index/i,
                loader: 'worker-loader',
                options: {
                    filename: './workers/ripple-worker.[contenthash].js',
                },
            },
            {
                test: /\workers\/blockfrost\/index/i,
                loader: 'worker-loader',
                options: {
                    filename: './workers/blockfrost-worker.[contenthash].js',
                },
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
        modules: ['node_modules'],
        mainFields: ['browser', 'module', 'main'],

        fallback: {
            fs: false, // ignore "fs" import in fastxpub (hd-wallet)
            https: false, // ignore "https" import in "ripple-lib"
            vm: false, // ignore "vm" imports in "asn1.js@4.10.1" > crypto-browserify"
            util: require.resolve('util'), // required by "ripple-lib"
            assert: require.resolve('assert'), // required by multiple dependencies
            crypto: require.resolve('crypto-browserify'), // required by multiple dependencies
            stream: require.resolve('stream-browserify'), // required by utxo-lib and keccak
            events: require.resolve('events'),
            // nodeusb dependencies, but it should't be needed, since it is only in desktop
            // any ideas?
            // path: require.resolve('path-browserify'),
            // os: require.resolve('os-browserify/browser'),
        },
    },
    performance: {
        hints: false,
    },
    plugins: [
        // provide fallback for global objects.
        // resolve.fallback will not work since those objects are not imported as modules.
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            Promise: ['es6-promise', 'Promise'],
            process: 'process/browser',
        }),
        // resolve @trezor/connect modules as "browser"
        new webpack.NormalModuleReplacementPlugin(/\/workers\/workers$/, resource => {
            resource.request = resource.request.replace(/workers$/, 'workers-browser');
        }),
        new webpack.NormalModuleReplacementPlugin(/\/utils\/assets$/, resource => {
            resource.request = resource.request.replace(/assets$/, 'assets-browser');
        }),
        // resolve @trezor/transport module as "browser"
        // ? ???

        // copy public files
        new CopyWebpackPlugin({
            patterns: [
                // copy firmware releases, bridge releases from '@trezor/connect-common'
                { from: COMMON_DATA_SRC, to: `${DIST}/data` },
            ],
        }),
        new HtmlWebpackPlugin({
            chunks: ['iframe'],
            filename: 'iframe.html',
            template: path.resolve(__dirname, '../src/static/iframe.html'),
            minify: false,
            inject: false,
        }),
    ],

    // @trezor/utxo-lib NOTE:
    // When uglifying the javascript, you must exclude the following variable names from being mangled:
    // Array, BigInteger, Boolean, Buffer, ECPair, Function, Number, Point and Script.
    // This is because of the function-name-duck-typing used in typeforce.
    optimization: {
        emitOnErrors: true,
        moduleIds: 'named',
        minimizer: [
            new TerserPlugin({
                parallel: true,
                extractComments: false,
                terserOptions: {
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
                            'events',
                        ],
                    },
                },
            }),
        ],
    },
};

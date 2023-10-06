/* eslint-disable import/no-default-export */

import path from 'path';
import webpack from 'webpack';
import TerserPlugin from 'terser-webpack-plugin';

const SRC = path.resolve(__dirname, '../../connect/src');
const DIST = path.resolve(__dirname, '../../suite-desktop/dist/connect');

const config: webpack.Configuration = {
    target: 'electron-main',
    mode: 'production',
    entry: { 'trezor-connect': path.join(SRC, 'index.ts') },
    output: {
        filename: '[name].js',
        chunkFilename: '[name].[contenthash:8].js',
        asyncChunks: true,
        path: DIST,
        publicPath: './',
        library: { type: 'umd' },
    },
    externals: ['bufferutil', 'memcpy', 'utf-8-validate', 'usb'],
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-typescript'],
                    },
                },
            },
        ],
    },
    resolve: {
        modules: ['node_modules'],
        mainFields: ['module', 'main'],
        extensions: ['.ts', '.js'],
        alias: {
            '@emurgo/cardano-serialization-lib-nodejs': '@emurgo/cardano-serialization-lib-browser',
        },
    },
    performance: {
        hints: false,
    },
    optimization: {
        minimizer: [
            new TerserPlugin({
                extractComments: false,
                terserOptions: {
                    format: {
                        comments: false,
                    },
                },
            }),
        ],
    },

    // We are using WASM package - it's much faster (https://github.com/Emurgo/cardano-serialization-lib)
    // This option makes it possible
    // Unfortunately Cardano Serialization Lib triggers webpack warning:
    // "Critical dependency: the request of a dependency is an expression" due to require in generated wasm module
    // https://github.com/Emurgo/cardano-serialization-lib/issues/119
    experiments: { asyncWebAssembly: true },
    ignoreWarnings: [{ module: /cardano-serialization-lib-browser/ }],
};

export default config;

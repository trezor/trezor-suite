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
        mainFields: ['main', 'module'],
        extensions: ['.ts', '.js'],
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
};

export default config;

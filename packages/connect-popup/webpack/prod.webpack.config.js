const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

const SRC = path.resolve(__dirname, '../src');
const STATIC_SRC = path.join(SRC, 'static');
const DIST = path.resolve(__dirname, '../build');

module.exports = {
    target: 'web',
    mode: 'production',
    entry: {
        popup: `${SRC}/index.ts`,
    },
    output: {
        filename: 'popup.[contenthash].js',
        path: `${DIST}`,
        publicPath: './',
    },
    module: {
        rules: [
            {
                test: /\.(ts)$/,
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
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        modules: ['node_modules'],
        fallback: {
            // DataManager -> FirmwareInfo -> rollout
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
        },
    },
    plugins: [
        new HtmlWebpackPlugin({
            chunks: ['popup'],
            template: `${STATIC_SRC}/popup.html`,
            filename: 'popup.html',
            inject: false,
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: `${STATIC_SRC}/popup.css`,
                    to: DIST,
                },
            ],
        }),
    ],
    optimization: {
        minimize: true,
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

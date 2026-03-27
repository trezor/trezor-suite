const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

const { SRC, BUILD } = require('./constants');

module.exports = {
    target: 'web',
    mode: 'production',
    entry: {
        indexUI: [`${SRC}/index.ui.ts`],
    },
    output: {
        filename: '[name]-[contenthash].js',
        path: BUILD,
    },
    module: {
        rules: [
            {
                test: [/workers.*\/index.ts$/],
                loader: 'worker-loader',
                options: {
                    filename: './worker.[contenthash].js',
                },
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
        modules: [SRC, 'node_modules'],
        extensions: ['.ts', '.js'],
        fallback: {
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
        },
    },
    performance: {
        hints: false,
    },
    plugins: [
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser.js',
        }),
        new HtmlWebpackPlugin({
            chunks: ['indexUI'],
            template: `${SRC}/index.html`,
            filename: 'index.html',
            inject: true,
        }),
    ],
    optimization: {
        emitOnErrors: true,
    },
};

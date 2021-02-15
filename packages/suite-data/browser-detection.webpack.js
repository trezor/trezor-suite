/* eslint-disable @typescript-eslint/no-var-requires */
const webpack = require('webpack');
const RemovePlugin = require('remove-files-webpack-plugin');
const path = require('path');

module.exports = {
    mode: 'production',
    entry: path.resolve(__dirname, './src/browser-detection/index.ts'),
    output: {
        path: path.resolve(__dirname, 'files/browser-detection'),
        filename: 'index.js',
    },
    module: {
        rules: [
            {
                test: /\.ts?$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            transpileOnly: true,
                        },
                    },
                ],
            },
            {
                test: /\.(gif|png|jpe?g|svg)$/i,
                use: 'url-loader',
            },
        ],
    },
    performance: {
        hints: false,
    },
};

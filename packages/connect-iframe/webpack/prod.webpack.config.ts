import path from 'path';
import webpack from 'webpack';
import merge from 'webpack-merge';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import { config as baseConfig } from './base.webpack.config';

const DIST = path.resolve(__dirname, '../build');
const config: webpack.Configuration = {
    // common instructions that are able to build correctly imports from @trezor/connect (reusing this in popup)
    entry: {
        iframe: path.resolve(__dirname, '../src/index.ts'),
    },
    output: {
        filename: 'js/[name].[contenthash].js',
        path: DIST,
        publicPath: './',
    },
    plugins: [
        new HtmlWebpackPlugin({
            chunks: ['iframe'],
            filename: 'iframe.html',
            template: path.resolve(__dirname, '../src/static/iframe.html'),
            minify: false,
            inject: false,
        }),
    ],
};

export default merge([config, baseConfig]);

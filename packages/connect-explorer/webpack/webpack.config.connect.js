import { TREZOR_CONNECT, TREZOR_IFRAME, TREZOR_POPUP, TREZOR_CONNECT_FILES } from './constants';
import path from 'path';
import webpack from 'webpack';
import webpackMerge from 'webpack-merge';
import baseConfig from './webpack.config.dev';
import HtmlWebpackPlugin from 'html-webpack-plugin';

module.exports = webpackMerge(baseConfig, {
    entry: {
        'trezor-connect2': `${TREZOR_CONNECT}.js`,
        'iframe': `${TREZOR_IFRAME}`,
        'popup': `${TREZOR_POPUP}`,
    },
    resolve: {
        alias: {
            'trezor-connect': `${TREZOR_CONNECT}`,
        }
    },
    plugins: [
        new HtmlWebpackPlugin({
            chunks: ['iframe'],
            filename: `iframe.html`,
            template: `${TREZOR_CONNECT_FILES}iframe.html`,
            inject: true
        }),
        new HtmlWebpackPlugin({
            chunks: ['popup'],
            filename: 'popup.html',
            template: `${TREZOR_CONNECT_FILES}popup.html`,
            inject: true
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development-connect'),
            PRODUCTION: JSON.stringify(false)
        })
    ]
} );
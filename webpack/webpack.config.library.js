import { TREZOR_LIBRARY } from './constants';
import path from 'path';
import webpack from 'webpack';
import webpackMerge from 'webpack-merge';
import baseConfig from './webpack.config.dev';

module.exports = webpackMerge(baseConfig, {
    entry: {
        'trezor-library': `${TREZOR_LIBRARY}.js`
    },
    resolve: {
        alias: {
            'trezor-connect': `${TREZOR_LIBRARY}`,
        }
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development-library'),
            PRODUCTION: JSON.stringify(false)
        })
    ]
} );

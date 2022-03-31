import webpack from 'webpack';
import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import prod from './prod.webpack.config';

// Generate inline script hosted on https://connect.trezor.io/X/trezor-connect.js
// This is compiled and polyfilled npm package without Core logic

const config: webpack.Configuration = {
    target: 'web',
    mode: 'production',
    entry: {
        'trezor-connect': path.resolve(__dirname, '../src/index.ts'),
        'trezor-connect.min': path.resolve(__dirname, '../src/index.ts'),
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, '../build'),
        publicPath: './',
        library: 'TrezorConnect',
        libraryTarget: 'umd',
        libraryExport: 'default',
    },

    module: prod.module,
    resolve: prod.resolve,
    performance: prod.performance,

    optimization: {
        minimizer: [
            new TerserPlugin({
                exclude: /trezor-connect.js/,
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

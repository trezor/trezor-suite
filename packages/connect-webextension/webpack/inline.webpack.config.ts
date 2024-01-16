import webpack from 'webpack';
import path from 'path';
import CopyPlugin from 'copy-webpack-plugin';

import prod from './prod.webpack.config';

// Generate inline script hosted on https://connect.trezor.io/X/trezor-connect-webextension.js
// This is compiled and polyfilled npm package without Core logic

const config: webpack.Configuration = {
    target: 'web',
    mode: 'production',
    entry: {
        'trezor-connect-webextension': path.resolve(__dirname, '../src/index.ts'),
        'trezor-connect-webextension.min': path.resolve(__dirname, '../src/index.ts'),
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
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: `${path.join(__dirname, '..', 'dist', 'content-script.js')}`,
                    to: path.resolve(__dirname, '../build'),
                },
            ],
        }),
    ],
    performance: prod.performance,
    optimization: prod.optimization,
};

// eslint-disable-next-line import/no-default-export
export default config;

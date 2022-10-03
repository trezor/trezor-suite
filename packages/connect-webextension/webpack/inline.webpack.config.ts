import webpack from 'webpack';
import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';
import prod from './prod.webpack.config';

// This is compiled and polyfilled npm package without Core logic

const config: webpack.Configuration = {
    target: 'webworker',
    mode: 'production',
    entry: {
        'trezor-connect-background-script': path.resolve(__dirname, '../src/index.ts'),
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
                exclude: /trezor-connect-background-script.js/,
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

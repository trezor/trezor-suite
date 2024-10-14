import webpack from 'webpack';
import path from 'path';
import TerserPlugin from 'terser-webpack-plugin';

// Generate single entry javascript bundle in build/js folder

const DIST = path.resolve(__dirname, '../build');

const config: webpack.Configuration = {
    target: 'web',
    mode: 'production',

    output: {
        filename: 'js/[name].[contenthash].js',
        path: DIST,
        publicPath: './',
    },
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
        mainFields: ['browser', 'module', 'main'],
        extensions: ['.ts', '.js'],
        fallback: {
            // Polyfills crypto API for Node.js libraries in the browser. 'crypto' does not run without 'stream'
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
        },
    },
    performance: {
        hints: false,
    },
    optimization: {
        // [beta version]: keep not minimized
        minimize: false,
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

// eslint-disable-next-line import/no-default-export
export default config;

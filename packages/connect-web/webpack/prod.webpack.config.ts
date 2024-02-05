import webpack from 'webpack';
import path from 'path';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';

// Generate additional files hosted on https://connect.trezor.io/X/

const DIST = path.resolve(__dirname, '../build');

const config: webpack.Configuration = {
    target: 'web',
    mode: 'production',
    entry: {
        // webusb
        webusb: path.resolve(__dirname, '../src/webusb/index.ts'),
        // webextension
        extensionPermissions: path.resolve(
            __dirname,
            '../src/webextension/extensionPermissions.ts',
        ),
    },
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
    // todo: this block is identical in connect-web, connect-explorer, and connect-explorer-webextension
    resolve: {
        modules: ['node_modules'],
        mainFields: ['browser', 'module', 'main'],
        extensions: ['.ts', '.js'],
        fallback: {
            fs: false, // ignore "fs" import in markdown-it-imsize
            path: false, // ignore "path" import in markdown-it-imsize
        },
    },
    performance: {
        hints: false,
    },
    plugins: [
        new HtmlWebpackPlugin({
            chunks: ['webusb'],
            filename: 'webusb.html',
            template: path.join(__dirname, '../src/webusb/webusb.html'),
            inject: true,
            minify: false,
        }),
        new HtmlWebpackPlugin({
            chunks: ['extensionPermissions'],
            filename: 'extension-permissions.html',
            template: path.join(__dirname, '../src/webextension/extension-permissions.html'),
            inject: true,
            minify: false,
        }),
    ],
    optimization: {
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

export default config;

import path from 'path';
import webpack, { DefinePlugin } from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import CopyPlugin from 'copy-webpack-plugin';
import * as URLS from '@trezor/urls';
import { version } from '../package.json';
import { execSync } from 'child_process';

const STATIC_SRC = path.join(__dirname, '../src/static');
const DIST = path.resolve(__dirname, '../build');

const commitHash = execSync('git rev-parse HEAD').toString().trim();

const config: webpack.Configuration = {
    target: 'web',
    mode: 'production',
    entry: {
        popup: path.resolve(__dirname, '../src/index.tsx'),
        log: path.resolve(__dirname, '../src/log.tsx'),
    },
    output: {
        filename: 'js/[name].[contenthash].js',
        path: DIST,
        publicPath: './',
    },
    // todo: not 100% sure about this config. lets focus on this in review
    module: {
        rules: [
            // TypeScript/JavaScript
            {
                test: /\.(j|t)sx?$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        cacheDirectory: true,
                        presets: [
                            [
                                '@babel/preset-react',
                                {
                                    runtime: 'automatic',
                                },
                            ],
                            '@babel/preset-typescript',
                        ],
                        plugins: [
                            '@babel/plugin-proposal-class-properties',
                            [
                                'babel-plugin-styled-components',
                                {
                                    displayName: true,
                                    preprocess: true,
                                },
                            ],
                        ],
                    },
                },
            },
            // Images
            {
                test: /\.(gif|jpe?g|png|svg)$/,
                type: 'asset/resource',
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.tsx', '.js', '.jsx'],
        modules: ['node_modules'],
        mainFields: ['browser', 'module', 'main'],
    },
    plugins: [
        new DefinePlugin({
            'process.env.VERSION': JSON.stringify(version),
            'process.env.COMMIT_HASH': JSON.stringify(commitHash),
            'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        }),
        new HtmlWebpackPlugin({
            chunks: ['popup'],
            template: `${STATIC_SRC}/popup.html`,
            filename: 'popup.html',
            inject: false,
            minify: false,
            urls: URLS,
        }),
        new HtmlWebpackPlugin({
            chunks: ['log'],
            template: `${STATIC_SRC}/log.html`,
            filename: 'log.html',
            inject: false,
            minify: false,
            urls: URLS,
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: `${STATIC_SRC}/popup.css`,
                    to: DIST,
                },
                // legacy fonts, should be removed once refactoring into React is finished
                {
                    from: `${STATIC_SRC}/fonts`,
                    to: `${DIST}/fonts`,
                },
                {
                    from: `${path.join(__dirname, '../../suite-data/files/fonts')}`,
                    to: `${DIST}/fonts`,
                },
                {
                    from: path.join(__dirname, '../../suite-data/files/images/png/trezor-*'),
                    to: `${DIST}/images/[name][ext]`,
                },
                {
                    from: path.join(__dirname, '../../connect-iframe/build'),
                    to: `${DIST}`,
                },
            ],
        }),
    ],
    optimization: {
        minimize: true,
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
    externals: {
        'js/core': 'js/core',
    },
};

export default config;

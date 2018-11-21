import webpack from 'webpack';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import GitRevisionPlugin from 'git-revision-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from '../../trezor-connect/node_modules/mini-css-extract-plugin'; // eslint-disable-line

import {
    TREZOR_CONNECT_ROOT,
    TREZOR_CONNECT_HTML,
    TREZOR_CONNECT_FILES,
    TREZOR_CONNECT, TREZOR_IFRAME, TREZOR_POPUP, TREZOR_WEBUSB,
    SRC,
    BUILD,
    PUBLIC,
    PORT,
} from './constants';

const gitRevisionPlugin = new GitRevisionPlugin();

module.exports = {
    watch: true,
    mode: 'development',
    devtool: 'inline-source-map',
    entry: {
        index: [`${SRC}/index.js`],
        'trezor-connect-npm': `${TREZOR_CONNECT}.js`,
        // 'extension-permissions': `${TREZOR_CONNECT_ROOT}src/js/extensionPermissions.js`,
        iframe: TREZOR_IFRAME,
        popup: TREZOR_POPUP,
        webusb: TREZOR_WEBUSB,
    },
    output: {
        filename: '[name].[hash].js',
        path: BUILD,
        globalObject: 'this', // fix for HMR inside WebWorker from 'hd-wallet'
    },
    devServer: {
        contentBase: [
            SRC,
            PUBLIC,
        ],
        hot: true,
        https: false,
        port: PORT,
        stats: 'minimal',
        inline: true,
    },
    module: {
        rules: [
            {
                test: /\.js?$/,
                exclude: [/node_modules/, /blockchain-link\/build\/workers/],
                use: ['babel-loader'],
            },
            {
                test: /\.less$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: { publicPath: '../' },
                    },
                    `${TREZOR_CONNECT_ROOT}/node_modules/css-loader`,
                    `${TREZOR_CONNECT_ROOT}/node_modules/less-loader`,
                ],
            },
            {
                test: /\.(png|gif|jpg)$/,
                loader: 'file-loader?name=./images/[name].[ext]',
                query: {
                    outputPath: './images',
                    name: '[name].[ext]',
                },
            },
            {
                test: /\.(ttf|eot|svg|woff|woff2)$/,
                loader: 'file-loader',
                query: {
                    outputPath: './fonts',
                    name: '[name].[ext]',
                },
            },
            {
                type: 'javascript/auto',
                test: /\.json/,
                exclude: /(node_modules)/,
                loader: 'file-loader',
                query: {
                    outputPath: './data',
                    name: '[name].[ext]',
                },
            },
            {
                type: 'javascript/auto',
                test: /\.wasm$/,
                loader: 'file-loader',
                query: {
                    name: 'js/[name].[ext]',
                },
            },
        ],
    },
    resolve: {
        modules: [
            SRC,
            'node_modules',
            `${TREZOR_CONNECT_ROOT}/node_modules`],
        alias: {
            public: PUBLIC,
            'trezor-connect': `${TREZOR_CONNECT}`,
        },
    },
    performance: {
        hints: false,
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name].css',
            chunkFilename: '[id].css',
        }),
        new HtmlWebpackPlugin({
            chunks: ['index'],
            template: `${SRC}index.html`,
            filename: 'index.html',
            inject: true,
            favicon: `${SRC}images/favicon.ico`,
        }),

        new HtmlWebpackPlugin({
            chunks: ['iframe'],
            filename: 'iframe.html',
            template: `${TREZOR_CONNECT_HTML}iframe.html`,
            inject: false,
        }),
        new HtmlWebpackPlugin({
            chunks: ['popup'],
            filename: 'popup.html',
            template: `${TREZOR_CONNECT_HTML}popup.html`,
            inject: false,
        }),
        new HtmlWebpackPlugin({
            chunks: ['webusb'],
            filename: 'webusb.html',
            template: `${TREZOR_CONNECT_HTML}webusb.html`,
            inject: true,
        }),
        // new HtmlWebpackPlugin({
        //     chunks: ['extension-permissions'],
        //     filename: `extension-permissions.html`,
        //     template: `${TREZOR_CONNECT_HTML}extension-permissions.html`,
        //     inject: true
        // }),

        new CopyWebpackPlugin([
            { from: TREZOR_CONNECT_FILES, to: 'data' },
        ]),
        new BundleAnalyzerPlugin({
            openAnalyzer: false,
            analyzerMode: false, // turn on to generate bundle pass 'static'
            reportFilename: 'bundle-report.html',
        }),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),

        new webpack.DefinePlugin({
            LOCAL: JSON.stringify(`http://localhost:${PORT}/`),
            COMMITHASH: JSON.stringify(gitRevisionPlugin.commithash()),
        }),

        // ignore node lib from trezor-link
        new webpack.IgnorePlugin(/\/iconv-loader$/),
    ],
    // ignoring "fs" import in fastxpub
    node: {
        fs: 'empty',
        path: 'empty',
    },
};
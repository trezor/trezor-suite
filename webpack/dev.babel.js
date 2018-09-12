import webpack from 'webpack';

import HtmlWebpackPlugin from 'html-webpack-plugin';
import FlowWebpackPlugin from 'flow-webpack-plugin';

import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

import {
    SRC, BUILD, PORT, PUBLIC,
} from './constants';


module.exports = {
    watch: true,
    mode: 'development',
    devtool: 'inline-source-map',
    entry: {
        index: [`${SRC}/index.js`],
    },
    output: {
        filename: '[name].[hash].js',
        path: BUILD,
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
                exclude: /node_modules/,
                use: [
                    'babel-loader',
                    {
                        loader: 'eslint-loader',
                        options: {
                            emitWarning: true,
                        },
                    },
                    {
                        loader: 'stylelint-custom-processor-loader',
                        options: {
                            configPath: '.stylelintrc',
                        },
                    },
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
        ],
    },
    resolve: {
        alias: {
            public: PUBLIC,
        },
        modules: [SRC, 'node_modules'],
    },
    performance: {
        hints: false,
    },
    plugins: [
        new FlowWebpackPlugin(),
        new HtmlWebpackPlugin({
            chunks: ['index'],
            template: `${SRC}index.html`,
            filename: 'index.html',
            inject: true,
            favicon: `${SRC}images/favicon.ico`,
        }),
        new BundleAnalyzerPlugin({
            openAnalyzer: false,
            analyzerMode: false, // turn on to generate bundle pass 'static'
            reportFilename: 'bundle-report.html',
        }),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
    ],
};

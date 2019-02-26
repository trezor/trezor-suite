import webpack from 'webpack';
import GitRevisionPlugin from 'git-revision-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import WebpackBuildNotifierPlugin from 'webpack-build-notifier';
import packageJson from '../package.json';

import {
    SRC, BUILD, PORT, PUBLIC, TRANSLATIONS,
} from './constants';

// turn on for bundle analyzing
// import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';

const gitRevisionPlugin = new GitRevisionPlugin();

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
        // host: '0.0.0.0',
        contentBase: [
            SRC,
            PUBLIC,
        ],
        stats: 'minimal',
        hot: true,
        https: false,
        quiet: false,
        port: PORT,
        inline: true,
    },
    module: {
        rules: [
            {
                test: /\.js?$/,
                exclude: /node_modules/,
                use: [
                    'babel-loader',
                    'react-hot-loader/webpack',
                    {
                        loader: 'eslint-loader',
                        options: {
                            emitWarning: true,
                        },
                    },
                    {
                        loader: 'stylelint-custom-processor-loader',
                        options: {
                            emitWarning: true,
                            configPath: '.stylelintrc',
                        },
                    },
                ],
            },
            {
                test: /\.(png|gif|jpg)$/,
                loader: 'file-loader?name=./images/[name].[ext]',
                options: {
                    outputPath: './images',
                    name: '[name].[ext]',
                },
            },
            {
                test: /\.(ttf|eot|svg|woff|woff2)$/,
                loader: 'file-loader',
                options: {
                    outputPath: './fonts',
                    name: '[name].[ext]',
                },
            },
            {
                type: 'javascript/auto',
                test: /\.json/,
                exclude: [/(node_modules)/, TRANSLATIONS],
                loader: 'file-loader',
                options: {
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
        new WebpackBuildNotifierPlugin({
            title: 'Trezor Wallet',
            suppressSuccess: true,
        }),
        new webpack.DefinePlugin({
            VERSION: JSON.stringify(packageJson.version),
            COMMITHASH: JSON.stringify(gitRevisionPlugin.commithash()),
        }),
        new HtmlWebpackPlugin({
            chunks: ['index'],
            template: `${SRC}index.html`,
            filename: 'index.html',
            inject: true,
            favicon: `${SRC}images/favicon.ico`,
        }),
        // new BundleAnalyzerPlugin({
        //     openAnalyzer: false,
        //     analyzerMode: false, // turn on to generate bundle pass 'static'
        //     reportFilename: 'bundle-report.html',
        // }),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
    ],
};

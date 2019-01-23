/* @flow */

import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
// import FlowWebpackPlugin from 'flow-webpack-plugin';

import {
    SRC, BUILD, PORT,
} from './constants';

module.exports = {
    watch: true,
    mode: 'development',
    devtool: 'inline-source-map',
    entry: {
        indexUI: [`${SRC}/ui/index.ui.js`],
        index: [`${SRC}/index.js`],
        // ripple: [`${SRC}/workers/ripple/index.js`],
    },
    output: {
        filename: '[name].[hash].js',
        path: BUILD,
    },
    devServer: {
        contentBase: [
            SRC,
        ],
        hot: false,
        https: false,
        port: PORT,
        stats: 'normal',
        inline: true,
    },
    module: {
        rules: [
            {
                test: /\.js?$/,
                exclude: /node_modules/,
                use: [
                    'babel-loader',
                    // {
                    //     loader: 'eslint-loader',
                    //     options: {
                    //         emitWarning: true,
                    //     },
                    // },
                ],
            },
        ],
    },
    resolve: {
        modules: [SRC, 'node_modules'],
        alias: {
            'ws-browser': `${SRC}/utils/ws.js`,
        },
    },
    performance: {
        hints: false,
    },
    plugins: [
        new webpack.NormalModuleReplacementPlugin(/^ws$/, 'ws-browser'),
        // new FlowWebpackPlugin({
        //     reportingSeverity: 'warning',
        // }),
        new HtmlWebpackPlugin({
            chunks: ['indexUI'],
            template: `${SRC}ui/index.html`,
            filename: 'index.html',
            inject: true,
        }),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        // new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
    ],
    node: {
        net: 'empty',
        tls: 'empty',
        dns: 'empty',
    }
};

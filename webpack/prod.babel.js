import { SRC, BUILD } from './constants';

import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

module.exports = {
    mode: 'production',
    entry: {
        'index': [ `${SRC}js/index.js` ]
    },
    output: {
        filename: 'js/[name].[hash].js',
        path: BUILD,
        publicPath: './',
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: ['babel-loader']
            },
            {
                test: /\.less$/,
                use: [
                    {
                        loader: MiniCssExtractPlugin.loader,
                        options: { publicPath: '../' }
                    },
                    'css-loader',
                    'less-loader',
                ]
            },
            {
                test: /\.(png|gif|jpg)$/,
                exclude: /(node_modules)/,
                loader: 'file-loader',
                query: {
                    outputPath: './images',
                    name: '[name].[hash].[ext]'
                }
            },
            {
                test: /\.(ttf|eot|svg|woff|woff2)$/,
                loader: 'file-loader',
                query: {
                    outputPath: './fonts',
                    name: '[name].[hash].[ext]',
                },
            },
            {
                type: 'javascript/auto',
                test: /\.json/,
                exclude: /(node_modules)/,
                loader: 'file-loader',
                query: {
                    outputPath: './data',
                    name: '[name].[hash].[ext]',
                },
            },
        ]
    },
    resolve: {
        modules: [SRC, 'node_modules'],
    },
    performance: {
        hints: false
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: 'css/[name].[hash].css',
            chunkFilename: '[id].css',
        }),
        
        new HtmlWebpackPlugin({
            chunks: ['index'],
            template: `${SRC}index.html`,
            filename: 'index.html',
            inject: true
        }),

        new CopyWebpackPlugin([
            //{from: `${SRC}/app/robots.txt`},
            { from: `${SRC}images/favicon.ico`, to: `${BUILD}favicon.ico` },
            { from: `${SRC}images/favicon.png`, to: `${BUILD}favicon.png` },
            //{ from: `${SRC}data`, to: `${BUILD}data`, cache: false },
        ]),
    ],

    // optimization: {
    //     minimize: false
    // }
}

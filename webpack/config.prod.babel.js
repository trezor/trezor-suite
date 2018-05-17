import { SRC, BUILD, PORT } from './constants';

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
                    MiniCssExtractPlugin.loader,
                    { 
                        loader: 'css-loader',
                        // options: { minimize: true } 
                    },
                    { 
                        loader: 'less-loader',
                        // options: { minimize: true } 
                    }
                ]
            },
            {
                test: /\.(png|gif|jpg)$/,
                exclude: /(node_modules)/,
                loader: 'file-loader',
                query: {
                    publicPath: '../',
                    name: 'images/[name].[hash].[ext]'
                }
            },
            {
                test: /\.(ttf|eot|svg|woff|woff2)$/,
                loader: 'file-loader',
                query: {
                    publicPath: '../',
                    name: 'fonts/[name].[hash].[ext]',
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
            { from: `${SRC}data`, to: `${BUILD}data`, cache: false },
            { from: `${SRC}assets`, to: `${BUILD}assets`, cache: false },
        ]),

        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.NamedModulesPlugin(),
    ]
}

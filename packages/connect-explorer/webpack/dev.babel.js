import { SRC, BUILD, PORT } from './constants';

import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

module.exports = {
    watch: true,
    mode: 'development',
    devtool: 'inline-source-map',
    entry: {
        'index': [`${SRC}js/index.js` ]
    },
    output: {
        filename: '[name].[hash].js',
        path: BUILD,
    },
    devServer: {
        contentBase: SRC,
        hot: true,
        https: true,
        port: PORT,
        stats: 'minimal',
        inline: true,
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: ['babel-loader', 'react-hot-loader/webpack']
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
                loader: 'file-loader?name=./images/[name].[ext]',
                query: {
                    outputPath: './images',
                    name: '[name].[ext]',
                }
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
            filename: '[name].css',
            chunkFilename: '[id].css',
        }),
        
        new HtmlWebpackPlugin({
            chunks: ['index'],
            template: `${SRC}index.html`,
            filename: 'index.html',
            inject: true
        }),

        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
    ]
}

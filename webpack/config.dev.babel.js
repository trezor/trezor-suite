import { SRC, BUILD, PORT } from './constants';

import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

module.exports = {
    watch: true,
    mode: 'development',
    devtool: 'inline-source-map',
    entry: {
        'index': [ 'react-hot-loader/patch', `${SRC}js/index.js` ]
    },
    output: {
        filename: '[name].[hash].js',
        path: BUILD,
        publicPath: '/',
    },
    devServer: {
        contentBase: SRC,
        hot: true,
        https: false,
        port: PORT,
        stats: 'minimal',
        inline: true,
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
                    'css-loader',
                    'less-loader',
                ]
            },
            {
                test: /\.(png|gif|jpg)$/,
                loader: 'file-loader?name=./images/[name].[ext]'
            },
            {
                test: /\.(ttf|eot|svg|woff|woff2)$/,
                loader: 'file-loader',
                query: {
                    name: './fonts/[name].[hash].[ext]',
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

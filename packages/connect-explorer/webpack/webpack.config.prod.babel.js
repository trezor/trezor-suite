import { SRC, BUILD } from './constants';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const extractLess = new ExtractTextPlugin({
    filename: 'css/[name].[contenthash].css',
    //disable: process.env.NODE_ENV === 'development'
});

module.exports = {
    entry: {
        index: ['whatwg-fetch', `${SRC}js/index.js`]
    },
    output: {
        filename: 'js/[name].[chunkhash].js',
        path: BUILD
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
                include: `${SRC}styles`,
                loader: extractLess.extract({
                    use: [
                        { loader: 'css-loader' },
                        { loader: 'less-loader' }
                    ],
                    fallback: 'style-loader'
                })
            },
            {
                test: /\.(ttf|eot|svg|woff|woff2)$/,
                loader: 'file-loader?publicPath=../&name=fonts/[name].[ext]',
            },
            {
                test: /\.(png|gif|jpg)$/,
                loader: 'file-loader?publicPath=../&name=images/[name].[ext]',
            },
        ]
    },
    resolve: {
        modules: [SRC, 'node_modules']
    },
    performance: {
        hints: false
    },
    plugins: [

        extractLess,

        new HtmlWebpackPlugin({
            template: `${SRC}index.html`,
            inject: 'body',
        }),
        
        new CopyWebpackPlugin([
            //{from: `${SRC}/app/robots.txt`},
            { from: `${SRC}js/vendor`, to: `${BUILD}js/vendor` },
            { from: `${SRC}images/favicon.ico` },
            { from: `${SRC}images/favicon.png` },
            //{ from: `${SRC}config.json` },
            { from: `${SRC}images`, to: `${BUILD}images` },
        ]),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.optimize.UglifyJsPlugin({
            compress: {
                warnings: false,
            }
        }),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
            PRODUCTION: JSON.stringify(false)
        })
    ]
}

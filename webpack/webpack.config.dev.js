import { TREZOR_CONNECT_FILES, SRC, PORT } from './constants';
import path from 'path';
import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ExtractTextPlugin from 'extract-text-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';

const extractLess = new ExtractTextPlugin({
    filename: './[name].[contenthash].css',
    // disable: process.env.NODE_ENV === 'development'
});

module.exports = {
    devtool: 'inline-source-map',
    entry: {
        'index': [ `${SRC}js/index.js`, `webpack-hot-middleware/client?path=/__webpack_hmr&timeout=20000&reload=true&__webpack_public_path=http://webpack:${PORT}`]
    },
    output: {
        filename: '[name].[hash].js',
        path: '/',
        publicPath: '/',
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
                loader: extractLess.extract({
                    use: [
                        { loader: 'css-loader' },
                        { loader: 'less-loader' }
                    ],
                    fallback: 'style-loader'
                })
            },
            {
                test: /\.(png|gif|jpg)$/,
                loader: 'file-loader?name=./images/[name].[ext]'
            },
            {
                test: /\.(wasm)$/,
                loader: 'file-loader',
                query: {
                    name: 'js/[name].[ext]',
                },
            },
            {
                test: /\.json$/,
                loader: 'json-loader'
            },
            {
                test: /\.(ttf|eot|svg|woff|woff2)$/,
                loader: 'file-loader',
                query: {
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
        extractLess,
        new HtmlWebpackPlugin({
            chunks: ['index'],
            template: `${SRC}index.html`,
            filename: 'index.html',
            inject: true
        }),
        new CopyWebpackPlugin([
            { from: `${TREZOR_CONNECT_FILES}coins.json` },
            { from: `${TREZOR_CONNECT_FILES}releases.json` },
            { from: `${TREZOR_CONNECT_FILES}latest.txt` },
            { from: `${TREZOR_CONNECT_FILES}config_signed.bin` },
            // { from: `${SRC}images/favicon.png` },
            // { from: `${SRC}images` },
        ]),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('development'),
            PRODUCTION: JSON.stringify(false)
        })
    ],
    // ignoring "fs" import in fastxpub
    node: {
        fs: "empty"
    }
}

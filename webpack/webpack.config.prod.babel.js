import { SRC, BUILD, TREZOR_LIBRARY, TREZOR_CONNECT_FILES } from './constants';
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
        index: ['whatwg-fetch', `${SRC}js/index.js`],
        'trezor-library': `${TREZOR_LIBRARY}.js`
    },
    output: {
        filename: 'js/[name].[hash].js',
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
                test: /\.css$/,
                loader: extractLess.extract({
                    use: [
                        { loader: 'css-loader' }
                    ],
                    fallback: 'style-loader'
                })
            },
            {
                test: /\.(png|gif|jpg)$/,
                loader: 'file-loader?name=../images/[name].[ext]'
            },
            {
                test: /\.(ttf|eot|svg|woff|woff2)$/,
                loader: 'file-loader?publicPath=../&name=fonts/[name].[ext]',
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
        ]
    },
    resolve: {
        modules: [SRC, 'node_modules'],
        alias: {
            'trezor-connect': `${TREZOR_LIBRARY}`,
        }
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
            //{ from: `${SRC}js/vendor`, to: `${BUILD}js/vendor` },
            //{ from: `${SRC}config.json` },
            { from: `${SRC}images`, to: `${BUILD}images` },
            { from: `${SRC}data`, to: `${BUILD}data` },
        ]),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        // new webpack.optimize.UglifyJsPlugin({
        //     compress: {
        //         warnings: false,
        //     }
        // }),
        new CopyWebpackPlugin([
            { from: `${TREZOR_CONNECT_FILES}coins.json` },
            { from: `${TREZOR_CONNECT_FILES}releases.json` },
            { from: `${TREZOR_CONNECT_FILES}latest.txt` },
            { from: `${TREZOR_CONNECT_FILES}config_signed.bin` },
        ]),
        new webpack.DefinePlugin({
            'process.env.NODE_ENV': JSON.stringify('production'),
            PRODUCTION: JSON.stringify(false)
        }),
        new webpack.IgnorePlugin(/node-fetch/), // for trezor-link warning
    ],
    // ignoring "fs" import in fastxpub
    node: {
        fs: "empty"
    }
}

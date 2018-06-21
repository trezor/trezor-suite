import { 
    TREZOR_CONNECT_ROOT,
    TREZOR_CONNECT_HTML,
    TREZOR_CONNECT_FILES,
    TREZOR_CONNECT, TREZOR_IFRAME, TREZOR_POPUP,
    SRC, 
    BUILD,
    PORT 
} from './constants';

import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

module.exports = {
    watch: true,
    mode: 'development',
    devtool: 'inline-source-map',
    entry: {
        'trezor-connect-npm': `${TREZOR_CONNECT}.js`,
        'iframe': ['babel-polyfill', `${TREZOR_IFRAME}`], // polyfill to trezor-link :(
        'popup': `${TREZOR_POPUP}`,
        'index': [ 'react-hot-loader/patch', `${SRC}js/index.js` ]
    },
    output: {
        filename: '[name].[hash].js',
        path: BUILD,
        globalObject: 'this', // fix for HMR inside WebWorker from 'hd-wallet'
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
                test: /\.wasm$/,
                loader: 'file-loader',
                query: {
                    name: 'js/[name].[ext]',
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
        modules: [SRC, 'node_modules', `${TREZOR_CONNECT_ROOT}/node_modules`],
        alias: {
            'trezor-connect': `${TREZOR_CONNECT}`,
            'flowtype/trezor': `${TREZOR_CONNECT_ROOT}src/flowtype/empty.js`,
        }
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

        new HtmlWebpackPlugin({
            chunks: ['iframe'],
            filename: `iframe.html`,
            template: `${TREZOR_CONNECT_HTML}iframe.html`,
            inject: true
        }),
        new HtmlWebpackPlugin({
            chunks: ['popup'],
            filename: 'popup.html',
            template: `${TREZOR_CONNECT_HTML}popup.html`,
            inject: true
        }),

        new CopyWebpackPlugin([
            { from: `${TREZOR_CONNECT_FILES}config.json`, to: 'data/config.json' },
            { from: `${TREZOR_CONNECT_FILES}coins.json`, to: 'data/coins.json' },
            { from: `${TREZOR_CONNECT_FILES}releases-1.json`, to: 'data/releases-1.json' },
            { from: `${TREZOR_CONNECT_FILES}releases-2.json`, to: 'data/releases-2.json' },
            { from: `${TREZOR_CONNECT_FILES}latest.txt`, to: 'data/latest.txt' },
            { from: `${TREZOR_CONNECT_FILES}config_signed.bin`, to: 'data/config_signed.bin' },
            { from: `${TREZOR_CONNECT_FILES}messages.json`, to: 'data/messages.json' },
        ]),

        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),

        new webpack.DefinePlugin({
            LOCAL: JSON.stringify(`http://localhost:${PORT}/`),
        }),

        // ignore node lib from trezor-link
        new webpack.IgnorePlugin(/\/iconv-loader$/),
    ],

    // ignoring "fs" import in fastxpub
    node: {
        fs: "empty",
        path: "empty",
    }
}

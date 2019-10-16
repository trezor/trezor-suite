const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const RemovePlugin = require('remove-files-webpack-plugin');

const path = require('path');

// mozna upravit cestu
const SRC = 'node_modules/trezor-connect';
const DATA_SRC = `${SRC}/data`;

// iframe is not in npm, so we have its template in suite-data
const HTML_SRC = path.resolve(__dirname, 'iframe.html');

const DIST = path.resolve(__dirname, 'files/connect');

module.exports = {
    mode: 'none',
    entry: {
        iframe: `./node_modules/trezor-connect/lib/iframe/iframe.js`,
    },
    output: {
        filename: 'js/[name].[hash].js',
        path: DIST,
        publicPath: './',
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: [
                    /node_modules/,
                    // path.resolve(__dirname, '../../node_modules/trezor-link/lib/lowlevel/sharedConnectionWorker')
                ],
                use: ['babel-loader'],
            },
            // {
            //     type: 'javascript/auto',
            //     test: /\.json/,
            //     exclude: /node_modules/,
            //     loader: 'file-loader',
            //     query: {
            //         outputPath: './data',
            //         name: '[name].[hash].[ext]',
            //     },
            // },
        ],
    },
    resolve: {
        modules: [SRC, 'node_modules'],
    },
    performance: {
        hints: false,
    },
    plugins: [
        new webpack.NormalModuleReplacementPlugin(/.blake2b$/, './blake2b.js'),
        new webpack.NormalModuleReplacementPlugin(/env\/node$/, './env/browser'),
        new webpack.NormalModuleReplacementPlugin(/env\/node\/workers$/, '../env/browser/workers'),
        new webpack.NormalModuleReplacementPlugin(
            /env\/node\/networkUtils$/,
            '../env/browser/networkUtils',
        ),
        new CopyWebpackPlugin([
            { from: DATA_SRC, to: `${DIST}/data` }, // only messages, coins, firmware releases
        ]),
        // ignore Node.js lib from trezor-link
        new webpack.IgnorePlugin(/\/iconv-loader$/),
        new webpack.IgnorePlugin(/\trezor-link\/lib\/lowlevel\/sharedConnectionWorker/),
        new HtmlWebpackPlugin({
            chunks: ['iframe'],
            filename: 'iframe.html',
            template: HTML_SRC,
            inject: false,
        }),
        new RemovePlugin({
            after: {
                test: [
                    {
                        folder: `${DIST}/workers`,
                        method: (filePath) => {
                            console.warn('filepath ================', filePath);
                            console.warn(filePath.includes('shared-connection-worker'))
                            return filePath.includes('shared-connection-worker.');
                        }
                    } 
                ]
            }
        })
    ],

    // @trezor/utxo-lib NOTE:
    // When uglifying the javascript, you must exclude the following variable names from being mangled:
    // Array, BigInteger, Boolean, Buffer, ECPair, Function, Number, Point and Script.
    // This is because of the function-name-duck-typing used in typeforce.
    optimization: {
        minimizer: [
            new TerserPlugin({
                parallel: true,
                terserOptions: {
                    ecma: 6,
                    mangle: {
                        reserved: [
                            'Array',
                            'BigInteger',
                            'Boolean',
                            'Buffer',
                            'ECPair',
                            'Function',
                            'Number',
                            'Point',
                            'Script',
                        ],
                    },
                },
            }),
        ],
    },

    // ignoring Node.js import in fastxpub (hd-wallet)
    node: {
        fs: 'empty',
        path: 'empty',
        net: 'empty',
        tls: 'empty',
    },
};

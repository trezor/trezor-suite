
import webpack from 'webpack';
import GitRevisionPlugin from 'git-revision-webpack-plugin';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import FriendlyErrorsWebpackPlugin from 'friendly-errors-webpack-plugin';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import { SRC, BUILD, PUBLIC } from './constants';


const gitRevisionPlugin = new GitRevisionPlugin();

module.exports = {
    mode: 'production',
    entry: {
        index: [`${SRC}index.js`],
    },
    output: {
        filename: '[name].[hash].js',
        path: BUILD,
        publicPath: './',
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
            {
                test: /\.(png|gif|jpg)$/,
                exclude: /(node_modules)/,
                loader: 'file-loader',
                query: {
                    outputPath: './images',
                    name: '[name].[hash].[ext]',
                },
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
        ],
    },
    resolve: {
        alias: {
            public: PUBLIC,
        },
        modules: [SRC, 'node_modules'],
    },
    performance: {
        hints: false,
    },
    plugins: [
        new webpack.DefinePlugin({
            'process.env.BUILD': JSON.stringify(process.env.BUILD),
            COMMITHASH: JSON.stringify(gitRevisionPlugin.commithash()),
        }),
        new HtmlWebpackPlugin({
            chunks: ['index'],
            template: `${SRC}index.html`,
            filename: 'index.html',
            inject: true,
            favicon: `${SRC}images/favicon.ico`,
        }),
        new CopyWebpackPlugin([
            { from: `${PUBLIC}`, to: './' },
        ]),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        new webpack.NamedModulesPlugin(),
        new FriendlyErrorsWebpackPlugin(),
    ],
};

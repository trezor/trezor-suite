import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import { SRC, BUILD, PORT } from './constants';

module.exports = {
    watch: true,
    mode: 'development',
    devtool: 'inline-source-map',
    entry: {
        indexUI: [`${SRC}/ui/index.ui.ts`],
        index: [`${SRC}/index.ts`],
    },
    output: {
        filename: '[name].js',
        path: BUILD,
    },
    devServer: {
        contentBase: `${SRC}ui`,
        hot: false,
        https: false,
        port: PORT,
        stats: 'normal',
        inline: true,
    },
    module: {
        rules: [
            {
                test: [/ripple\/index.ts$/, /blockbook\/index.ts$/],
                use: ['worker-loader'],
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'ts-loader',
                        options: { configFile: 'tsconfig.lib.json' },
                    },
                    // {
                    //     loader: 'eslint-loader',
                    //     options: {
                    //         emitWarning: true,
                    //     },
                    // },
                ],
            },
            {
                test: /\.js?$/,
                exclude: /node_modules/,
                use: [
                    'babel-loader',
                    // {
                    //     loader: 'eslint-loader',
                    //     options: {
                    //         emitWarning: true,
                    //     },
                    // },
                ],
            },
        ],
    },
    resolve: {
        modules: [SRC, 'node_modules'],
        extensions: ['.ts', '.js'],
        alias: {
            'ws-browser': `${SRC}/utils/ws.js`,
        },
    },
    performance: {
        hints: false,
    },
    plugins: [
        new webpack.NormalModuleReplacementPlugin(/^ws$/, 'ws-browser'),
        new HtmlWebpackPlugin({
            chunks: ['indexUI'],
            template: `${SRC}ui/index.html`,
            filename: 'index.html',
            inject: true,
        }),
        new webpack.optimize.OccurrenceOrderPlugin(),
        new webpack.NoEmitOnErrorsPlugin(),
        // new webpack.HotModuleReplacementPlugin(),
        new webpack.NamedModulesPlugin(),
    ],
    node: {
        net: 'empty',
        tls: 'empty',
        dns: 'empty',
    },
};

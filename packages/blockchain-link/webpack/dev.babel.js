import webpack from 'webpack';
import HtmlWebpackPlugin from 'html-webpack-plugin';

import { SRC, BUILD, PORT } from './constants';

module.exports = {
    target: 'web',
    mode: 'development',
    devtool: 'inline-source-map',
    entry: {
        indexUI: [`${SRC}/ui/index.ui.ts`],
        index: [`${SRC}/index.ts`],
    },
    output: {
        filename: '[name]-[hash].js',
        path: BUILD,
    },
    stats: {
        children: true,
    },
    devServer: {
        static: {
            directory: `${SRC}ui`,
        },
        hot: false,
        https: false,
        port: PORT,
    },
    module: {
        rules: [
            {
                test: [/workers.*\/index.ts$/],
                loader: 'worker-loader',
                options: {
                    filename: './worker.[contenthash].js',
                },
            },
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
        ],
    },
    resolve: {
        modules: [SRC, 'node_modules'],
        extensions: ['.ts', '.js'],
        alias: {
            'ws-browser': `${SRC}/utils/ws.js`,
        },
        fallback: {
            https: false, // required by ripple-lib
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
        },
    },
    performance: {
        hints: false,
    },
    plugins: [
        // provide fallback plugins
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser',
        }),
        new webpack.NormalModuleReplacementPlugin(/^ws$/, 'ws-browser'),
        new HtmlWebpackPlugin({
            chunks: ['indexUI'],
            template: `${SRC}ui/index.html`,
            filename: 'index.html',
            inject: true,
        }),
    ],
    optimization: {
        emitOnErrors: true,
        moduleIds: 'named',
    },
};

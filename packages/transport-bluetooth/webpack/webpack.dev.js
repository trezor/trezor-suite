const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const PACKAGE_ROOT = path.normalize(path.join(__dirname, '..'));
const PORT = 8089;
const SRC = path.join(PACKAGE_ROOT, 'src/');

module.exports = {
    target: 'web',
    mode: 'development',
    devtool: 'source-map',
    entry: {
        indexUI: [`${SRC}/ui/index.ts`],
        index: [`${SRC}/index.ts`],
    },
    stats: {
        children: true,
    },
    devServer: {
        static: {
            directory: `${SRC}ui`,
        },
        hot: false,
        // https: false,
        port: PORT,
    },
    module: {
        rules: [
            {
                test: input => input.includes('background-sharedworker'),
                loader: 'worker-loader',
                options: {
                    worker: 'SharedWorker',
                    filename: './workers/sessions-background-sharedworker.[contenthash].js',
                },
            },
            {
                test: /\.(js|ts)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-typescript'],
                    },
                },
            },
        ],
    },
    resolve: {
        modules: [SRC, 'node_modules'],
        extensions: ['.ts', '.js'],
        mainFields: ['browser', 'module', 'main'],
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
        new webpack.NormalModuleReplacementPlugin(
            /^ws$/,
            path.join(PACKAGE_ROOT, '../blockchain-link/src/utils/ws'),
        ),
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

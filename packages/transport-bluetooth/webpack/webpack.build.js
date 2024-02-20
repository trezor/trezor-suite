const path = require('path');
const webpack = require('webpack');
const CopyPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const PACKAGE_ROOT = path.normalize(path.join(__dirname, '..'));
const SRC = path.join(PACKAGE_ROOT, 'src/');
const BUILD = path.join(PACKAGE_ROOT, 'build/');

module.exports = {
    target: 'web',
    mode: 'production',
    entry: {
        index: `${SRC}/ui/index.ts`,
    },
    output: {
        filename: '[name].js',
        path: BUILD,
        publicPath: './',
        libraryTarget: 'umd',
        libraryExport: 'default',
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-typescript'],
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        modules: [SRC, 'node_modules'],
        extensions: ['.ts', '.js'],
        mainFields: ['main', 'module'], // prevent wrapping default exports by harmony export (bignumber.js in ripple issue)
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
            chunks: ['index'],
            template: `${SRC}ui/index.html`,
            filename: 'index.html',
            inject: true,
        }),
        new CopyPlugin({
            patterns: [
                {
                    from: `${SRC}/ui/index.css`,
                    to: `${BUILD}/index.css`,
                },
            ],
        }),
    ],
    optimization: {
        minimize: false,
    },
    // ignore optional modules, dependencies of "ws" lib
    externals: ['utf-8-validate', 'bufferutil'],
};

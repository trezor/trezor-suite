const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: path.resolve(__dirname, '../src/renderer.js'),
    output: {
        filename: '[name].[hash].js',
        path: path.resolve(__dirname, '../build'),
        publicPath: './',
    },
    module: {
        rules: [
            {
                test: /\.(js|ts|tsx)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
        ],
    },
    resolve: {
        modules: ['node_modules'],
    },
    plugins: [
        new CopyPlugin({
            patterns: [
                {
                    from: path.join(__dirname, '..', '..', '..', 'connect-iframe', 'build'),
                    to: path.join(__dirname, '../build-renderer/trezor-connect-bundled'),
                },
            ],
        }),
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: path.join(__dirname, '../src/index.html'),
        }),
    ],
};

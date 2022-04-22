const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
    mode: 'production',
    entry: './src/renderer.js',
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
        // mainFields: ['browser', 'main', 'module'],
    },
    plugins: [
        new HtmlWebpackPlugin({
            filename: 'index.html',
            template: 'src/index.html',
        }),

        new CopyWebpackPlugin({
            patterns: [{ from: './assets', to: './assets' }],
        }),
    ],
};

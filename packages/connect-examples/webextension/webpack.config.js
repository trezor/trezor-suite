const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const webpack = require('webpack');

module.exports = {
    entry: {
        popup: './src/popup.ts',
        'service-worker': './src/service-worker.ts',
        'connect-manager': './src/connect-manager.ts',
    },
    output: {
        path: path.resolve(__dirname, 'build'),
        filename: '[name].js',
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: ['babel-loader'],
            },
            {
                test: /\.ts$/,
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
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/popup.html',
            filename: 'popup.html',
            chunks: ['popup'],
        }),
        new HtmlWebpackPlugin({
            template: './src/connect-manager.html',
            filename: 'connect-manager.html',
            chunks: ['connect-manager'],
        }),
        new CopyWebpackPlugin({
            patterns: [{ from: 'src/manifest.json', to: 'manifest.json' }],
        }),
        new webpack.DefinePlugin({
            // Override the Suite web URL hosting connect-popup.
            // Example: SUITE_WEB_URL=http://localhost:8000 yarn build
            __SUITE_WEB_URL__: JSON.stringify(process.env.SUITE_WEB_URL || ''),
        }),
    ],
    mode: process.env.NODE_ENV || 'development',
    devtool: process.env.NODE_ENV === 'production' ? undefined : 'inline-source-map',
};

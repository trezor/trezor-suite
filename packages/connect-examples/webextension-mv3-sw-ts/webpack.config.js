const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

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
    ],
    mode: 'development',
    devtool: 'inline-source-map',
};

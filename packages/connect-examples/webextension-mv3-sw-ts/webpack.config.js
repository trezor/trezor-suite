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
        path: path.resolve(__dirname, 'dist'),
        filename: '[name].js',
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: 'ts-loader',
                exclude: /node_modules/,
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: './src/popup.html',
            filename: 'popup.html',
            chunks: ['popup'],
        }),
        new CopyWebpackPlugin({
            patterns: [{ from: 'src/manifest.json', to: 'manifest.json' }],
        }),
    ],
    mode: 'development',
    devtool: 'inline-source-map',
};

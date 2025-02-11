const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const path = require('path');
const { WebpackPluginServe } = require('webpack-plugin-serve');

module.exports = {
    watch: true,
    mode: 'development',
    devtool: 'inline-source-map',
    entry: path.resolve(__dirname, '../src/renderer.js'),
    output: {
        path: path.resolve(__dirname, '../build-renderer'),
        filename: 'renderer.js',
    },

    resolve: {
        modules: ['node_modules'],
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
    plugins: [
        new CopyWebpackPlugin({
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
        new WebpackPluginServe({
            port: 8080,
            hmr: false,
            static: [path.join(__dirname, '../build-renderer')],
        }),
    ],
};

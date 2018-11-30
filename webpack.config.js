const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const path = require('path');

const OUTPUT_PATH = path.resolve(__dirname, 'lib');
const isProd = process.env.NODE_ENV === 'production';

module.exports = {
    mode: isProd ? 'production' : 'development',
    output: {
        filename: isProd ? 'trezor-update.min.js' : 'trezor-update.js',
        path: OUTPUT_PATH,
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                },
            },
        ],
    },
    plugins: [],
    optimization: {
        minimize: isProd,
        minimizer: [new UglifyJsPlugin()],
    },
};

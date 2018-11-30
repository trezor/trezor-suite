const path = require('path');

const OUTPUT_PATH = path.resolve(__dirname, 'lib');

module.exports = {
    mode: 'production',
    output: {
        filename: 'trezor-update.js',
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
    optimization: {
        minimize: false,
    },
    plugins: [],
};

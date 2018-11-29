const path = require('path');

const OUTPUT_PATH = path.resolve(__dirname, 'lib');

module.exports = {
    entry: './src/index.js',
    mode: process.env.NODE_ENV || 'production',
    output: {
        filename: 'index.js',
        path: OUTPUT_PATH,
    },
    module: {
        rules: [],
    },
    plugins: [],
};

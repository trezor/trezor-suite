/**
 * Electron Build setup
 */
const path = require('path');

const electronSource = path.join(__dirname, 'src-electron');
module.exports = {
    target: 'node',
    mode: 'production',
    entry: {
        electron: path.join(electronSource, 'electron.ts'),
        preload: path.join(electronSource, 'preload.ts'),
    },
    output: {
        filename: '[name].js',
        path: path.join(__dirname, 'dist'),
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
};

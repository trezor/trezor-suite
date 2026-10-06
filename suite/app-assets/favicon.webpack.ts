import path from 'path';
// eslint-disable-next-line import/no-extraneous-dependencies
import { DefinePlugin } from 'webpack';

module.exports = {
    target: 'browserslist',
    mode: 'production',
    entry: path.resolve(__dirname, './src/favicon.ts'),
    output: {
        path: path.resolve(__dirname, 'files'),
        filename: 'favicon.js',
    },
    resolve: {
        extensions: ['.ts', '.js'],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env', '@babel/preset-typescript'],
                    },
                },
            },
        ],
    },
    plugins: [
        new DefinePlugin({
            'process.env.ASSET_PREFIX': JSON.stringify(process.env?.ASSET_PREFIX),
        }),
    ],
    performance: {
        hints: false,
    },
};

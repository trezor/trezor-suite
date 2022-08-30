const path = require('path');
const webpack = require('webpack');

module.exports = {
    target: 'web',
    mode: 'development',
    // webpack will transpile TS and JS files
    resolve: {
        extensions: ['.ts', '.js'],
        fallback: {
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
        },
    },
    module: {
        rules: [
            {
                // every time webpack sees a TS file (except for node_modules)
                // webpack will use "ts-loader" to transpile it to JavaScript
                test: /\.ts$/,
                exclude: [/node_modules/],
                use: [
                    {
                        loader: 'ts-loader',
                        options: {
                            // skip typechecking for speed
                            transpileOnly: true,
                        },
                    },
                ],
            },
        ],
    },
    plugins: [
        // provide fallback plugins
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            process: 'process/browser',
        }),
    ],
};

const { SRC, BUILD } = require('./constants');

module.exports = {
    target: 'node',
    mode: 'production',
    entry: {
        'blockbook-worker': `${SRC}workers/blockbook/index.ts`,
        'ripple-worker': `${SRC}workers/ripple/index.ts`,
        'blockfrost-worker': `${SRC}workers/blockfrost/index.ts`,
        'solana-worker': `${SRC}workers/solana/index.ts`,
    },
    output: {
        filename: '[name].js',
        path: `${BUILD}module/`,
        publicPath: './',
        libraryTarget: 'umd',
        libraryExport: 'default',
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                exclude: /node_modules/,
                use: [
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-typescript'],
                        },
                    },
                ],
            },
        ],
    },
    resolve: {
        modules: [SRC, 'node_modules'],
        extensions: ['.ts', '.js'],
        mainFields: ['main', 'module'], // prevent wrapping default exports by harmony export (bignumber.js in ripple issue)
    },
    performance: {
        hints: false,
    },
    optimization: {
        minimize: false,
    },
    // ignore optional modules, dependencies of "ws" lib
    externals: ['utf-8-validate', 'bufferutil'],
};

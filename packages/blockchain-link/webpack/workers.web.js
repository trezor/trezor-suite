const { SRC, BUILD } = require('./constants');

module.exports = {
    target: 'webworker',
    mode: 'production',
    entry: {
        'ripple-worker': `${SRC}workers/ripple/index.ts`,
        'blockbook-worker': `${SRC}workers/blockbook/index.ts`,
        'blockfrost-worker': `${SRC}workers/blockfrost/index.ts`,
        'solana-worker': `${SRC}workers/solana/index.ts`,
        'stellar-worker': `${SRC}workers/stellar/index.ts`,
        'evm-rpc-worker': `${SRC}workers/evm-rpc/index.ts`,
    },
    output: {
        filename: '[name].js',
        path: `${BUILD}web/`,
        publicPath: './',
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
        // - 'browser' first so packages like @xrplf/isomorphic pick noble-based browser builds instead of node:crypto
        // - 'module' is intentionally omitted; it caused a default-export wrapping issue with bignumber.js in the ripple worker
        mainFields: ['browser', 'main'],
    },
    externals: [
        {
            // Replace cross-fetch with native fetch, otherwise it will use node-fetch and fails to build
            'cross-fetch': 'fetch',
        },
    ],
    performance: {
        hints: false,
    },
    optimization: {
        minimize: false,
    },
};

import { BUILD, SRC } from './constants.js';

export default {
    target: 'webworker',
    mode: 'production',
    entry: {
        'ripple-worker': `${SRC}workers/ripple/rippleWorker.ts`,
        'blockbook-worker': `${SRC}workers/blockbook/blockbookWorker.ts`,
        'blockfrost-worker': `${SRC}workers/blockfrost/blockfrostWorker.ts`,
        'solana-worker': `${SRC}workers/solana/solanaWorker.ts`,
        'stellar-worker': `${SRC}workers/stellar/stellarWorker.ts`,
        'evm-rpc-worker': `${SRC}workers/evm-rpc/evmRpcWorker.ts`,
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

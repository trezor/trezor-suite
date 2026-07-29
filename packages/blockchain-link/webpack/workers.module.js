import { BUILD, SRC } from './constants.js';

export default {
    target: 'node',
    mode: 'production',
    entry: {
        'blockbook-worker': `${SRC}workers/blockbook/blockbookWorker.ts`,
        'ripple-worker': `${SRC}workers/ripple/rippleWorker.ts`,
        'blockfrost-worker': `${SRC}workers/blockfrost/blockfrostWorker.ts`,
        'solana-worker': `${SRC}workers/solana/solanaWorker.ts`,
        'stellar-worker': `${SRC}workers/stellar/stellarWorker.ts`,
        'evm-rpc-worker': `${SRC}workers/evm-rpc/evmRpcWorker.ts`,
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
    },
    performance: {
        hints: false,
    },
    optimization: {
        minimize: false,
    },
    // Ignore optional modules, dependencies of "ws" lib.
    externals: ['utf-8-validate', 'bufferutil'],
};

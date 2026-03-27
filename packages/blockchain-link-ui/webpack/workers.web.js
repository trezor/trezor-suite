const { SRC, BUILD } = require('./constants');

module.exports = {
    target: 'webworker',
    mode: 'production',
    // require.resolve returns the real absolute path via yarn workspace symlinks,
    // so webpack's babel-loader processes the .ts files (exclude: /node_modules/ would block bare specifiers).
    entry: {
        'ripple-worker': require.resolve('@trezor/blockchain-link-ripple/src/index.ts'),
        'blockbook-worker': require.resolve('@trezor/blockchain-link-blockbook/src/index.ts'),
        'blockfrost-worker': require.resolve('@trezor/blockchain-link-blockfrost/src/index.ts'),
        'solana-worker': require.resolve('@trezor/blockchain-link-solana/src/index.ts'),
        'stellar-worker': require.resolve('@trezor/blockchain-link-stellar/src/index.ts'),
        'evm-rpc-worker': require.resolve('@trezor/blockchain-link-evm-rpc/src/index.ts'),
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
        mainFields: ['main', 'module'], // prevent wrapping default exports by harmony export (bignumber.js in ripple issue)
        fallback: {
            crypto: require.resolve('crypto-browserify'),
            stream: require.resolve('stream-browserify'),
        },
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

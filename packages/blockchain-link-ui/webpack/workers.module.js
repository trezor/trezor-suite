const { SRC, BUILD } = require('./constants');

module.exports = {
    target: 'node',
    mode: 'production',
    // require.resolve returns the real absolute path via yarn workspace symlinks,
    // so webpack's babel-loader processes the .ts files (exclude: /node_modules/ would block bare specifiers).
    entry: {
        'blockbook-worker': require.resolve('@trezor/blockchain-link-blockbook/src/index.ts'),
        'ripple-worker': require.resolve('@trezor/blockchain-link-ripple/src/index.ts'),
        'blockfrost-worker': require.resolve('@trezor/blockchain-link-blockfrost/src/index.ts'),
        'solana-worker': require.resolve('@trezor/blockchain-link-solana/src/index.ts'),
        'stellar-worker': require.resolve('@trezor/blockchain-link-stellar/src/index.ts'),
        'evm-rpc-worker': require.resolve('@trezor/blockchain-link-evm-rpc/src/index.ts'),
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

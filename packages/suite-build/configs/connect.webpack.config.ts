import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';

const connect: webpack.Configuration = {
    module: {
        rules: [
            {
                test: /pinger[\\/]pingWorker.ts/i,
                loader: 'worker-loader',
                options: {
                    filename: './workers/ping-worker.[contenthash].js',
                },
            },
            {
                test: /workers[\\/]blockbook[\\/]index/i,
                loader: 'worker-loader',
                options: {
                    filename: './workers/blockbook-worker.[contenthash].js',
                },
            },
            {
                test: /workers[\\/]ripple[\\/]index/i,
                loader: 'worker-loader',
                options: {
                    filename: './workers/ripple-worker.[contenthash].js',
                },
            },
            {
                test: /workers[\\/]blockfrost[\\/]index/i,
                loader: 'worker-loader',
                options: {
                    filename: './workers/blockfrost-worker.[contenthash].js',
                },
            },
            {
                test: /workers[\\/]stellar[\\/]index/i,
                loader: 'worker-loader',
                options: {
                    filename: './workers/stellar-worker.[contenthash].js',
                },
            },
            // fakin solana. for some reason it can't be running in a worker. at least becauses of playwright tests, where we can't manipulate time in the worker context, but
            // I hope there were more reasons not to use worker for solana
            // {
            //     test: /workers\/solana\/index/i,
            //     loader: 'worker-loader',
            //     options: {
            //         filename: './workers/solana-worker.[contenthash].js',
            //     },
            // },
            {
                test: /\.(js|ts)$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-typescript'],
                    },
                },
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
        modules: ['node_modules'],
        mainFields: ['browser', 'module', 'main'],

        fallback: {
            util: require.resolve('util'), // required by "xrpl.js"
            assert: require.resolve('assert'), // required by multiple dependencies
            crypto: require.resolve('crypto-browserify'), // required by multiple dependencies
            stream: require.resolve('stream-browserify'), // required by utxo-lib and keccak
            events: require.resolve('events'),
        },
    },
    performance: {
        hints: false,
    },
    // @trezor/utxo-lib NOTE:
    // When uglifying the javascript, you must exclude the following variable names from being mangled:
    // Array, BigInteger, Boolean, Buffer, ECPair, Function, Number, Point and Script.
    // This is because of the function-name-duck-typing used in typeforce.
    optimization: {
        emitOnErrors: true,
        moduleIds: 'named',
        minimizer: [
            new TerserPlugin({
                parallel: true,
                extractComments: false,
                terserOptions: {
                    mangle: {
                        reserved: [
                            'Array',
                            'BigInteger',
                            'Boolean',
                            'Buffer',
                            'ECPair',
                            'Function',
                            'Number',
                            'Point',
                            'Script',
                            'events',
                        ],
                    },
                },
            }),
        ],
        usedExports: true,
    },
    // We are using WASM package - it's much faster (https://github.com/Emurgo/cardano-serialization-lib)
    // This option makes it possible
    experiments: { asyncWebAssembly: true },
    ignoreWarnings: [
        // Unfortunately Cardano Serialization Lib triggers webpack warning:
        // "Critical dependency: the request of a dependency is an expression" due to require in generated wasm module
        // https://github.com/Emurgo/cardano-serialization-lib/issues/119
        { module: /cardano-serialization-lib-browser/ },
        // checkAuthenticityProof (see comment on how subtle is used there), should be safe to suppress this message
        warning =>
            warning.message.includes(
                "export 'subtle' (imported as 'crypto') was not found in 'crypto' ",
            ),
    ],
};

export default connect;

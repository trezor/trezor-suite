import path from 'path';
import { execSync } from 'child_process';
import webpack from 'webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import { version } from '../package.json';

const COMMON_DATA_SRC = '../../packages/connect-common/files';
const MESSAGES_SRC = '../../packages/protobuf/messages.json';

const DIST = path.resolve(__dirname, '../build');

// Because of Expo EAS, we need to use the commit hash from expo to avoid failing git command inside EAS
// because we need to call `yarn build:libs during native build`
const commitHash =
    process.env.EAS_BUILD_GIT_COMMIT_HASH || execSync('git rev-parse HEAD').toString().trim();

export const config: webpack.Configuration = {
    target: 'web',
    mode: 'production',
    module: {
        rules: [
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

            {
                test: (input: string) => input.includes('background-sharedworker'),
                loader: 'worker-loader',
                options: {
                    worker: 'SharedWorker',
                    filename: './workers/sessions-background-sharedworker.[contenthash].js',
                },
            },
            {
                test: /sharedLoggerWorker.ts/i,
                use: [
                    {
                        loader: 'worker-loader',
                        options: {
                            worker: 'SharedWorker',
                            // TODO: we are not using contenthash here because we want to use that worker from
                            // different environments (iframe, popup, connect-web, etc.) and we would not know the
                            // name of the file.
                            filename: './workers/shared-logger-worker.js',
                        },
                    },
                    {
                        loader: 'babel-loader',
                        options: {
                            presets: ['@babel/preset-typescript'],
                        },
                    },
                ],
            },
            {
                test: /\workers\/blockbook\/index/i,
                loader: 'worker-loader',
                options: {
                    filename: './workers/blockbook-worker.[contenthash].js',
                },
            },
            {
                test: /\workers\/ripple\/index/i,
                loader: 'worker-loader',
                options: {
                    filename: './workers/ripple-worker.[contenthash].js',
                },
            },
            {
                test: /\workers\/blockfrost\/index/i,
                loader: 'worker-loader',
                options: {
                    filename: './workers/blockfrost-worker.[contenthash].js',
                },
            },
        ],
    },
    resolve: {
        extensions: ['.ts', '.js'],
        modules: ['node_modules'],
        mainFields: ['browser', 'module', 'main'],

        fallback: {
            fs: false, // ignore "fs" import in fastxpub (hd-wallet)
            https: false, // ignore "https" import in "ripple-lib"
            vm: false, // ignore "vm" imports in "asn1.js@4.10.1" > crypto-browserify"
            util: require.resolve('util'), // required by "ripple-lib"
            assert: require.resolve('assert'), // required by multiple dependencies
            crypto: require.resolve('crypto-browserify'), // required by multiple dependencies
            stream: require.resolve('stream-browserify'), // required by utxo-lib and keccak
            events: require.resolve('events'),
            http: false,
            zlib: false,
            path: false, // usb
            os: false, // usb
        },
    },
    performance: {
        hints: false,
    },
    plugins: [
        // provide fallback for global objects.
        // resolve.fallback will not work since those objects are not imported as modules.
        new webpack.ProvidePlugin({
            Buffer: ['buffer', 'Buffer'],
            Promise: ['es6-promise', 'Promise'],
            process: 'process/browser',
        }),
        // resolve @trezor/connect modules as "browser"
        new webpack.NormalModuleReplacementPlugin(/\/workers\/workers$/, resource => {
            resource.request = resource.request.replace(/workers$/, 'workers-browser');
        }),
        new webpack.NormalModuleReplacementPlugin(/\/utils\/assets$/, resource => {
            resource.request = resource.request.replace(/assets$/, 'assets-browser');
        }),
        // copy public files
        new CopyWebpackPlugin({
            patterns: [
                // copy firmware releases, bridge releases from '@trezor/connect-common'
                { from: COMMON_DATA_SRC, to: `${DIST}/data` },
                // copy messages.json from '@trezor/transport'
                { from: MESSAGES_SRC, to: `${DIST}/data/messages`, force: true },
            ],
        }),
        new webpack.DefinePlugin({
            process: {
                env: {
                    VERSION: JSON.stringify(version),
                    COMMIT_HASH: JSON.stringify(commitHash),
                    NODE_ENV: JSON.stringify(process.env.NODE_ENV),
                },
            },
        }),
    ],

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

export default config;

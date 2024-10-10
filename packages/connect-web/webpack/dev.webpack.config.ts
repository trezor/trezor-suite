import path from 'path';
import fs from 'fs';
import { merge } from 'webpack-merge';
import { WebpackPluginServe } from 'webpack-plugin-serve';

// todo: https://github.com/trezor/trezor-suite/issues/5305
import popup from '../../connect-popup/webpack/prod.webpack.config';
// todo: https://github.com/trezor/trezor-suite/issues/5305
import iframe from '../../connect-iframe/webpack/prod.webpack.config';
import prod from './prod.webpack.config';

console.log('dev.webpack.config running !!!');
console.log('dev.webpack.config running !!!');
console.log('dev.webpack.config running !!!');
console.log('dev.webpack.config running !!!');
console.log('dev.webpack.config running !!!');
console.log('dev.webpack.config running !!!');
console.log('dev.webpack.config running !!!');
console.log('dev.webpack.config running !!!');
console.log('dev.webpack.config running !!!');
console.log('dev.webpack.config running !!!');
console.log('dev.webpack.config running !!!');
console.log('dev.webpack.config running !!!');
console.log('dev.webpack.config running !!!');
const dev = {
    mode: 'development',
    watch: true,
    devtool: 'eval-source-map',
    entry: {
        'trezor-connect': path.resolve(__dirname, '../src/index.ts'),
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, '../build'),
        publicPath: './',
        library: 'TrezorConnect',
        libraryTarget: 'umd',
        libraryExport: 'default',
    },
    plugins: [
        // connect-web dev needs to be served from https
        // to allow injection in 3rd party builds using trezor-connect-src param
        // for that, you need to generate your own key and cert
        new WebpackPluginServe({
            port: process.env.PORT ? parseInt(process.env.PORT) : 8088,
            hmr: true,
            https:
                process.env.NO_HTTPS === 'true'
                    ? undefined
                    : {
                          key: fs.readFileSync(path.join(__dirname, '../webpack/connect_dev.key')),
                          cert: fs.readFileSync(path.join(__dirname, '../webpack/connect_dev.crt')),
                      },
            static: [
                path.join(__dirname, '../build'),
                path.join(__dirname, '../../connect-popup/build'),
                path.join(__dirname, '../../connect-iframe/build'),
            ],
        }),
    ],
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
    // We are using WASM package - it's much faster (https://github.com/Emurgo/cardano-serialization-lib)
    // This option makes it possible
    experiments: { asyncWebAssembly: true },
    ignoreWarnings: [
        // Unfortunately Cardano Serialization Lib triggers webpack warning:
        // "Critical dependency: the request of a dependency is an expression" due to require in generated wasm module
        // https://github.com/Emurgo/cardano-serialization-lib/issues/119
        { module: /cardano-serialization-lib-browser/ },
        // checkAuthenticityProof (see comment on how subtle is used there), should be safe to suppress this message
        (warning: any) =>
            warning.message.includes(
                "export 'subtle' (imported as 'crypto') was not found in 'crypto' ",
            ),
    ],
};

export default merge([iframe, popup, prod, dev]);

import webpack from 'webpack';
import path from 'path';
import { getPathForProject } from '../utils/path';

console.log('web-connect-core.webpack.config');
console.log('web-connect-core.webpack.config');
console.log('web-connect-core.webpack.config');
console.log('web-connect-core.webpack.config');
console.log('web-connect-core.webpack.config');
console.log('web-connect-core.webpack.config');
console.log('web-connect-core.webpack.config');
console.log('web-connect-core.webpack.config');
console.log('web-connect-core.webpack.config');

const baseDir = getPathForProject('web');

export const config: webpack.Configuration = {
    target: 'web',
    mode: 'production',
    entry: {
        'core-in-module': path.resolve(__dirname, '../../connect/src/impl/core-in-module.ts'),
    },
    output: {
        filename: 'js/[name].js',
        path: path.join(baseDir, 'build'),
        publicPath: './',
        library: {
            type: 'module',
        },
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
    // // We are using WASM package - it's much faster (https://github.com/Emurgo/cardano-serialization-lib)
    // // This option makes it possible
    experiments: { asyncWebAssembly: true, outputModule: true },
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

export default config;

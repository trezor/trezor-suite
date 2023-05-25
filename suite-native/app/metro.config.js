/* eslint-disable require-await */
const nodejs = require('node-libs-browser');
const { makeMetroConfig } = require('@rnx-kit/metro-config');

module.exports = makeMetroConfig({
    transformer: {
        getTransformOptions: async () => ({
            transform: {
                experimentalImportSupport: false,
                inlineRequires: true,
            },
        }),
    },
    resolver: {
        blockList: [/libDev/],
        extraNodeModules: {
            // modules needed for trezor-connect
            crypto: nodejs.crypto,
            stream: nodejs.stream,
            https: nodejs.https,
            http: nodejs.http,
            zlib: nodejs.zlib,
        },
    },
});

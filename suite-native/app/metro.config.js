/* eslint-disable require-await */
const nodejs = require('node-libs-browser');
const path = require('path');

module.exports = {
    projectRoot: path.resolve(__dirname, '../../'),
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
        },
    },
};

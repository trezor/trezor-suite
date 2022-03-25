const path = require('path');
const nodejs = require('node-libs-browser');

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
        blockList: [/libDev/, /news-api\/build/],
        extraNodeModules: {
            // modules needed for trezor-connect
            crypto: nodejs.crypto,
            stream: nodejs.stream,
            https: nodejs.https,
            http: nodejs.http,
        },
    },
};

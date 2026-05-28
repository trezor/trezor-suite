const path = require('path');

const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testEnvironment: '../../JestCustomEnv.js',
    // `cborg` is pure-ESM (its `exports` field only declares `import`). Map the bare specifier
    // to its entry file directly and whitelist it for swc transpilation below.
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
        '^cborg$': path.resolve(__dirname, '../../node_modules/cborg/cborg.js'),
    },
    transformIgnorePatterns: ['/node_modules/(?!(@scure/base|@noble/hashes|cborg)/)'],
};

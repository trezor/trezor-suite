const path = require('path');

const { testPathIgnorePatterns, ...baseConfig } = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testEnvironment: '../../JestCustomEnv.js',
    collectCoverage: true,
    setupFiles: ['<rootDir>/setupJest.ts'],
    testPathIgnorePatterns: [...testPathIgnorePatterns, 'e2e'],
    // `cborg` is pure-ESM (its `exports` field only declares `import`). Map the bare specifier
    // to the entry file directly and let swc transpile it (whitelisted below).
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
        '^cborg$': path.resolve(__dirname, '../../node_modules/cborg/cborg.js'),
    },
    transformIgnorePatterns: [
        'node_modules/?!(uuid|react-intl|@formatjs/*|intl-messageformat|cborg)/',
    ],
};

const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    setupFiles: [
        'jest-canvas-mock',
        '<rootDir>/../../suite-common/test-utils/src/jsdomGlobalPolyfills.js',
    ],
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
        '\\.(svg|webp)$': '<rootDir>/mocks/fileMock.js',
    },
};

const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
        '\\.(svg|webp)$': '<rootDir>/mocks/fileMock.js',
    },
};

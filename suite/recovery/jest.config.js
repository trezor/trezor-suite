const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    roots: [
        '<rootDir>/src',
        '<rootDir>/tests',
        '<rootDir>/../../suite-common/test-utils/__mocks__',
    ],
};

const baseConfig = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    roots: ['<rootDir>/src', '<rootDir>/tests', '<rootDir>/../test-utils/__mocks__'],
};

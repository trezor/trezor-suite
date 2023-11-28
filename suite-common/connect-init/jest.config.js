const baseConfig = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    roots: ['<rootDir>/src', '<rootDir>/../test-utils/__mocks__'],
};

const baseConfig = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    roots: ['<rootDir>/src', '<rootDir>/../../suite-common/test-utils/__mocks__'],
};

const { testPathIgnorePatterns } = require('../../jest.config.base');

module.exports = {
    preset: '../../jest.config.base.js',
    collectCoverage: true,
    testPathIgnorePatterns: [...testPathIgnorePatterns, 'e2e'],
};

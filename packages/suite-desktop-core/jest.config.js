const { ...baseConfig } = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    roots: ['<rootDir>/src'],
    modulePathIgnorePatterns: ['node_modules', '<rootDir>/lib', '<rootDir>/libDev'],
    watchPathIgnorePatterns: ['<rootDir>/libDev', '<rootDir>/lib'],
    testPathIgnorePatterns: ['<rootDir>/libDev/', '<rootDir>/lib/'],
    testMatch: ['**/*.test.(ts|tsx|js)'],
};

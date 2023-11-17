const { ...baseConfig } = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    roots: ['<rootDir>/src'],
    modulePathIgnorePatterns: ['node_modules', '<rootDir>/lib', '<rootDir>/libDev'],
    watchPathIgnorePatterns: ['<rootDir>/libDev', '<rootDir>/lib'],
    testPathIgnorePatterns: ['<rootDir>/libDev/', '<rootDir>/lib/'],
    transformIgnorePatterns: ['/node_modules/'],
    testMatch: ['**/*.test.(ts|tsx|js)'],
};

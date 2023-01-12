module.exports = {
    preset: '../../jest.config.base.js',
    testEnvironment: 'node',
    testMatch: ['**/e2e/tests/*.test.ts'],
    modulePathIgnorePatterns: ['node_modules', '<rootDir>/lib', '<rootDir>/libDev'],
};

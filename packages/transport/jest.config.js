module.exports = {
    preset: '../../jest.config.base.js',
    testEnvironment: 'node',
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'],
    testPathIgnorePatterns: ['libDev', 'e2e'],
};

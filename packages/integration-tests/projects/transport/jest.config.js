module.exports = {
    testEnvironment: 'node',
    rootDir: './',
    moduleFileExtensions: ['js'],
    testMatch: ['**/tests/*.integration.js'],
    modulePathIgnorePatterns: ['node_modules', 'src/types'],
    setupFilesAfterEnv: ['<rootDir>/common.setup.js'],
    collectCoverage: false,
    verbose: true,
    bail: true,
};

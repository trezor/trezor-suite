module.exports = {
    testEnvironment: 'node',
    rootDir: './',
    moduleFileExtensions: ['js'],
    testMatch: [
        '**/e2e/tests/*.integration.js',
        '**/e2e/examples/*.integration.js'
    ],
    modulePathIgnorePatterns: ['node_modules', 'src/types'],
    setupFilesAfterEnv: [
        '<rootDir>/e2e/common.setup.js'],
    transformIgnorePatterns: [
        'node_modules/(?!(node-fetch|fetch-blob|data-uri-to-buffer|formdata-polyfill)/)',
    ],
    transform: {
        '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest',
    },
    collectCoverage: false,
    verbose: true,
    bail: true,
}
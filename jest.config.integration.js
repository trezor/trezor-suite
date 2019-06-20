module.exports = {
    rootDir: './',
    // testMatch: ['**/tests/unit/*.js', '**/tests/integration2/*.js'],
    testMatch: ['**/tests/integration/connection.js'],
    coverageDirectory: './coverage/',
    collectCoverage: false,
    moduleDirectories: ['node_modules', './'],
    // modulePaths: ['<rootDir>/build'],
    // modulePathIgnorePatterns: ['node_modules'],
    // setupFiles: ['./tests/setup.js'],
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
};

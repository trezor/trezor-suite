/*
 * Integration test for builded library located in './lib' directory
 */

module.exports = {
    rootDir: './',
    moduleFileExtensions: ['js', 'json'],
    // testMatch: ['**/tests/integration/*.js'],
    testMatch: ['**/tests/integration/connection.js'],
    collectCoverage: false,
    moduleDirectories: ['node_modules', './'], // './' - ia a home directory for the 'trezor-blockchain-link' library (lib/index.js)
    transform: {
        '^.+\\.js$': 'babel-jest',
    },
};

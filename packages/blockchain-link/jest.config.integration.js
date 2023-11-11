/*
 * Integration tests for library build in `./lib` and `./build` directory
 */

module.exports = {
    rootDir: './',
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
        },
    },
    moduleFileExtensions: ['js', 'ts', 'json'],
    testMatch: ['**/tests/integration/*.ts'],
    collectCoverage: false,
    moduleDirectories: ['node_modules', './'], // './' - ia a home directory for the 'trezor-blockchain-link' library (lib/index.js)
    modulePathIgnorePatterns: ['<rootDir>/libDev'],
    watchPathIgnorePatterns: ['<rootDir>/libDev'],
    transform: {
        '^.+\\.js$': 'babel-jest',
        '^.+\\.ts$': 'ts-jest',
    },
};

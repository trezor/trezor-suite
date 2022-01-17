module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/integration/electrum.ts'],
    collectCoverage: false,
};

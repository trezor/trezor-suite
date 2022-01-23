/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    testMatch: ['**/tests/*.test.js'],
    collectCoverage: true,
    collectCoverageFrom: ['src/**/*.ts'],
};

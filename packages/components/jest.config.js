module.exports = {
    roots: ['./src'],
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.json'
        },
    },
    moduleFileExtensions: ['js', 'ts'],
    coverageDirectory: 'coverage',
    collectCoverage: true,
    modulePathIgnorePatterns: ['node_modules'],
    collectCoverageFrom: ['utils/**.ts'],
    testMatch: ['**/tests/**/*.test.(ts|js)'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    preset: 'ts-jest',
};
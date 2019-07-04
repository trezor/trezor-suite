module.exports = {
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.json',
        },
    },
    moduleNameMapper: {
        '^@suite/(.+)': '<rootDir>/src/$1',
    },
    moduleFileExtensions: ['js', 'ts'],
    modulePathIgnorePatterns: ['node_modules'],
    testMatch: ['**/test/health/**'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    preset: 'ts-jest',
};
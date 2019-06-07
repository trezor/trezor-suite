module.exports = {

    // // modulePaths: ['src'],
    // modulePathIgnorePatterns: [
    //     'node_modules',
    // ],
    // collectCoverageFrom: [
    //     'src/**.ts',
    // ],
    // globals: {
    //     'ts-jest': {
    //         tsConfig: 'tsconfig.json',
    //     },
    // },
    // preset: 'ts-jest',
    // testMatch: ['tests/**/*.test.ts'],
    // transform: {
    //     '^.+\\.(ts|tsx)$': 'ts-jest',
    // },
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
    testMatch: ['**/tests/**/**'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    preset: 'ts-jest',
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
    automock: false,
    coverageDirectory: './coverage',
    collectCoverage: true,
};

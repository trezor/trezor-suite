module.exports = {
    roots: ['./src'],
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.json',
            // to speed up prototyping, this is how to disable ts in tests
            // diagnostics: false,
        },
    },
    setupFiles: ['<rootDir>/src/support/tests/setupJest.ts'],
    moduleNameMapper: {
        '^@suite/(.+)': '<rootDir>/src/$1',
        '^@(.+)-views/(.+)': '<rootDir>/src/views/$1/$2',
        '^@(.+)-views': '<rootDir>/src/views/$1/index',
        '^@(.+)-components/(.+)': '<rootDir>/src/components/$1/$2',
        '^@(.+)-components': '<rootDir>/src/components/$1/index',
        '^@(.+)-actions/(.+)': '<rootDir>/src/actions/$1/$2',
        '^@(.+)-actions': '<rootDir>/src/actions/$1/index',
        '^@(.+)-reducers/(.+)': '<rootDir>/src/reducers/$1/$2',
        '^@(.+)-reducers': '<rootDir>/src/reducers/$1/index',
        '^@(.+)-config/(.+)': '<rootDir>/src/config/$1/$2',
        '^@(.+)-config': '<rootDir>/src/config/$1/index',
        '^@(.+)-constants/(.+)': '<rootDir>/src/constants/$1/$2',
        '^@(.+)-constants': '<rootDir>/src/constants/$1/index',
        '^@(.+)-support/(.+)': '<rootDir>/src/support/$1/$2',
        '^@(.+)-support': '<rootDir>/src/support/$1/index',
        '^@(.+)-utils/(.+)': '<rootDir>/src/utils/$1/$2',
        '^@(.+)-utils': '<rootDir>/src/utils/$1/index',
        '^@(.+)-types/(.+)': '<rootDir>/src/types/$1/$2',
        '^@(.+)-types': '<rootDir>/src/types/$1/index',
    },
    moduleFileExtensions: ['js', 'ts'],
    coverageDirectory: './coverage',
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/src/reducers/**',
        '<rootDir>/src/utils/**',
        '<rootDir>/src/actions/**',
        '!**/constants/**',
        '!**/__tests__/**',
    ],
    coverageThreshold: {
        global: {
// <<<<<<< 5533b013408adc2e9e8adc414540a819f2847b9d
//             statements: 58.39,
//             branches: 62.53,
//             functions: 55.53,
//             lines: 59.78,
// =======
//             statements: 61.29,
//             branches: 64.07,
//             functions: 56.93,
//             lines: 62.75,
// >>>>>>> recovery tests, unexpected state separate components
        },
    },
    modulePathIgnorePatterns: ['node_modules', '<rootDir>/src/utils/suite/hooks'],
    testMatch: ['**/*.test.(ts|js)'],
    transform: {
        '^.+\\.(ts)$': 'ts-jest',
    },
    preset: 'ts-jest',
    verbose: false,
};

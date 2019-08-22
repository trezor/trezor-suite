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
        '^@(.+)-components/(.+)': '<rootDir>/src/components/$1/$2',
        '^@(.+)-actions/(.+)': '<rootDir>/src/actions/$1/$2',
        '^@(.+)-reducers/(.+)': '<rootDir>/src/reducers/$1/$2',
        '^@(.+)-config/(.+)': '<rootDir>/src/config/$1/$2',
        '^@(.+)-constants/(.+)': '<rootDir>/src/constants/$1/$2',
        '^@(.+)-support/(.+)': '<rootDir>/src/support/$1/$2',
        '^@(.+)-utils/(.+)': '<rootDir>/src/utils/$1/$2',
        '^@(.+)-types/(.+)': '<rootDir>/src/types/$1/$2',
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
            branches: 37,
            functions: 31,
            lines: 33,
            statements: 32,
        },
    },
    modulePathIgnorePatterns: ['node_modules'],
    testMatch: ['**/*.test.(ts|js)'],
    transform: {
        '^.+\\.(ts)$': 'ts-jest',
    },
    preset: 'ts-jest',
    verbose: true,
};

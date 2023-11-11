module.exports = {
    roots: ['<rootDir>/src'],
    moduleFileExtensions: ['js', 'ts', 'tsx'],
    coverageDirectory: './coverage',
    collectCoverage: true,
    collectCoverageFrom: ['<rootDir>/src/http.ts'],
    coverageThreshold: {
        global: {
            statements: 38,
            branches: 0,
            functions: 50,
            lines: 40,
        },
    },
    modulePathIgnorePatterns: ['node_modules', '<rootDir>/lib', '<rootDir>/libDev'],
    watchPathIgnorePatterns: ['<rootDir>/libDev', '<rootDir>/lib'],
    testPathIgnorePatterns: ['<rootDir>/libDev/', '<rootDir>/lib/'],
    transformIgnorePatterns: ['/node_modules/'],
    testMatch: ['**/*.test.(ts|tsx|js)'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    verbose: false,
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/tsconfig.json',
        },
    },
};

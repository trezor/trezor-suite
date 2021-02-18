module.exports = {
    roots: [
        '<rootDir>/src-electron',
    ],
    moduleFileExtensions: ['js', 'ts', 'tsx'],
    coverageDirectory: './coverage',
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/src-electron/http.ts',
    ],
    coverageThreshold: {
        global: {
            statements: 38,
            branches: 0,
            functions: 50,
            lines: 40,
        },
    },
    modulePathIgnorePatterns: [
        'node_modules',
    ],
    transformIgnorePatterns: [
        '/node_modules/',
    ],
    testMatch: [
        '**/*.test.(ts|tsx|js)'
    ],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    verbose: false,
    globals: {
        'ts-jest': {
            tsconfig: '<rootDir>/src-electron/tsconfig.json',
        },
    },
};

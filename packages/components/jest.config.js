module.exports = {
    roots: ['./src'],
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
        },
    },
    moduleFileExtensions: ['js', 'ts'],
    coverageDirectory: 'coverage',
    collectCoverage: true,
    modulePathIgnorePatterns: ['node_modules'],
    testMatch: ['**/*.test.(ts|js)'],
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    preset: 'ts-jest',
};

// all tests have same UTC timezone
process.env.TZ = 'UTC';

const babelConfig = {
    presets: [
        ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
        '@babel/preset-typescript',
        '@babel/preset-react',
    ],
};

module.exports = {
    setupFiles: [
        '<rootDir>/../test-utils/src/setupJest.ts',
        '<rootDir>/../test-utils/src/npmMocks.tsx',
    ],
    moduleFileExtensions: ['js', 'ts', 'tsx'],
    coverageDirectory: './coverage',
    collectCoverage: true,
    collectCoverageFrom: ['<rootDir>/src/**', '!**/__tests__/**', '!**/__fixtures__/**'],
    coverageThreshold: {
        global: {
            statements: 66,
            branches: 59,
            functions: 66,
            lines: 67,
        },
    },
    modulePathIgnorePatterns: ['node_modules', '<rootDir>/libDev'],
    testMatch: ['**/*.test.(ts|tsx|js)'],
    transform: {
        '\\.(ts|tsx)$': ['babel-jest', babelConfig],
    },
    verbose: false,
    watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
};

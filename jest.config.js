module.exports = {
    rootDir: './src',
    automock: false,
    coverageDirectory: '../coverage/',
    collectCoverage: true,
    testURL: 'http://localhost',
    modulePathIgnorePatterns: [
        'node_modules',
        'utils/build.js',
        'utils/windowUtils.js',
        'utils/promiseUtils.js',
        'utils/networkUtils.js',
    ],
    collectCoverageFrom: [
        'utils/**.js',
        'reducers/utils/**.js',
    ],
    coverageThreshold: {
        global: {
            branches: 100,
            functions: 100,
            lines: 100,
            statements: 100,
        },
    },
    setupFiles: [
        './support/setupJest.js',
    ],
    transform: {
        '^.+\\.jsx?$': 'babel-jest',
    },
};

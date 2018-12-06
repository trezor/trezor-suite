module.exports = {
    rootDir: './tests',
    testMatch: ['**/?(*.)+(test).js?(x)'],
    automock: false,
    coverageDirectory: './coverage/',
    collectCoverage: true,
    testURL: 'http://localhost',
    modulePathIgnorePatterns: [
        'node_modules',
        'utils/windowUtils.js',
        'utils/promiseUtils.js',
        'utils/networkUtils.js',
    ],
    collectCoverageFrom: [
        'utils/**.js',
        'reducers/utils/**.js',
    ],
    setupFiles: [
        './setupJest.js',
    ],
};
module.exports = {
    rootDir: './src',
    automock: false,
    coverageDirectory: '../coverage/',
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
        './support/setupJest.js',
    ],
};

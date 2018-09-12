module.exports = {
    rootDir: './src',
    automock: false,
    coverageDirectory: 'coverage/',
    collectCoverage: true,
    testURL: 'http://localhost',
    modulePathIgnorePatterns: [
        'node_modules',
        'utils/windowUtils.js',
    ],
    collectCoverageFrom: [
        'utils/**.js',
    ],
    setupFiles: [
        './support/setupJest.js',
    ],
};

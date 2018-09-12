module.exports = {
    rootDir: './src',
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
};

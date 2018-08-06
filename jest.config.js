module.exports = {
    rootDir: './src',
    collectCoverage: true,
    testURL: 'http://localhost',

    modulePathIgnorePatterns: [
        'node_modules',
    ],
    collectCoverageFrom: [
        'js/utils/**.js',
    ],
};

const babelConfig = {
    presets: [
        ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
        '@babel/preset-typescript',
        [
            '@babel/preset-react',
            {
                runtime: 'automatic',
            },
        ],
    ],
    plugins: [['@babel/plugin-proposal-decorators', { version: '2023-05' }]],
};

module.exports = {
    rootDir: process.cwd(),
    // An array of file extensions your modules use
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],

    // The glob patterns Jest uses to detect test files
    testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],

    // An array of regexp pattern strings that are matched against all test paths, matched tests are skipped
    testPathIgnorePatterns: [
        '/node_modules/',
        '/libDev/',
        '/lib/',
        '/dist/',
        '/build/',
        '/build-electron/',
        '/coverage/',
        '/public/',
    ],

    transform: {
        '\\.(js|jsx|ts|tsx)$': ['babel-jest', babelConfig],
    },

    // An array of regexp patterns that are matched against all source file paths before re-running tests in watch mode
    watchPathIgnorePatterns: ['libDev', 'lib'],
};

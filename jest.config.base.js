const path = require('path');

const { reactCompilerBabelOverride } = require('./react-compiler.config');

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
    plugins: [['@babel/plugin-proposal-decorators', { version: '2023-11' }]],
    // React Compiler is scoped via overrides (see react-compiler.config.js) — see plans/react-compiler-migration.md.
    overrides: [reactCompilerBabelOverride],
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

    transformIgnorePatterns: ['node_modules/?!(uuid|react-intl|@formatjs/*|intl-messageformat)/'],

    // An array of regexp patterns that are matched against all source file paths before re-running tests in watch mode
    watchPathIgnorePatterns: ['libDev', 'lib'],

    // An array of regexp pattern strings that are matched against all module paths before those paths are
    // to be considered 'visible' to the module loader
    modulePathIgnorePatterns: ['libDev'],
    moduleNameMapper: {
        '^reselect$': path.resolve(__dirname, 'suite-native/test-utils/src/mocks/reselectMock.ts'),
        // Enforce usage of JS version of bcrypto in tests because on CI we don't build native modules because it's slowing yarn install
        '^bcrypto/lib/(.*)$': 'bcrypto/lib/$1-browser',
        '^uint8array-tools$': require.resolve('uint8array-tools'), // same case as with uuid
        '^usb$': '<rootDir>../../packages/transport/mocks/usb.js', // "usb" package causes memory leaks
    },
};

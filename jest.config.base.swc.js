const path = require('path');

// NOTE: @swc/jest does not execute babel plugins, so babel-plugin-react-compiler is NOT wired here.
// Packages using this config (e.g. @trezor/components) exercise uncompiled code in tests even once
// the compiler is enabled in production. Consider migrating to jest.config.base.js when the
// compiler is enabled for that package. See plans/react-compiler-migration.md.

const swcConfig = {
    jsc: {
        parser: {
            syntax: 'typescript',
            tsx: true,
            decorators: true,
        },
        transform: {
            react: {
                runtime: 'automatic',
            },
            decoratorVersion: '2022-03',
        },
        target: 'esnext',
    },
    module: {
        type: 'commonjs',
    },
};

module.exports = {
    rootDir: process.cwd(),
    moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx'],

    testMatch: ['**/?(*.)+(spec|test).[tj]s?(x)'],

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
        '\\.(js|jsx|ts|tsx)$': ['@swc/jest', swcConfig],
    },

    transformIgnorePatterns: ['node_modules/?!(uuid|react-intl|@formatjs/*|intl-messageformat)/'],

    watchPathIgnorePatterns: ['libDev', 'lib'],

    modulePathIgnorePatterns: ['libDev'],
    moduleNameMapper: {
        '^reselect$': path.resolve(__dirname, 'suite-native/test-utils/src/mocks/reselectMock.ts'),
        '^bcrypto/lib/(.*)$': 'bcrypto/lib/$1-browser',
        '^uint8array-tools$': require.resolve('uint8array-tools'),
        '^usb$': '<rootDir>../../packages/transport/mocks/usb.js',
    },
};

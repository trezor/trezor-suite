const version = require('./package.json').suiteVersion;
const baseConfig = require('../../jest.config.base.swc');

// all tests have same UTC timezone
process.env.TZ = 'UTC';
process.env.LANG = 'en-US';
process.env.VERSION = version;

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

/**
 * @type {import('jest').Config}
 */
module.exports = {
    roots: [
        '<rootDir>/src',
        '<rootDir>/__mocks__',
        '<rootDir>/../../suite-common/test-utils/__mocks__',
    ],
    setupFiles: [
        'jest-canvas-mock', // for lottie-react
    ],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        '^@suite-common/(.+)': '<rootDir>/../../suite-common/$1',
        '^@trezor/(.+)': '<rootDir>/../$1',
        '^src/(.+)': '<rootDir>/src/$1',
        '\\.(mp4)$': '<rootDir>/__mocks__/import-mp4.js',
        '\\.(svg)$': '<rootDir>/__mocks__/import-svg.js',
        ...baseConfig.moduleNameMapper,
    },
    moduleFileExtensions: ['js', 'ts', 'tsx'],
    coverageDirectory: './coverage',
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/src/actions/**',
        '<rootDir>/src/hooks/**',
        '<rootDir>/src/middlewares/**',
        '<rootDir>/src/reducers/**',
        '<rootDir>/src/storage/**',
        '<rootDir>/src/utils/**',
        '!**/constants/**',
        '!**/__tests__/**',
        '!**/__fixtures__/**',
        '!<rootDir>/src/hooks/**/useTrading*',
    ],
    modulePathIgnorePatterns: ['node_modules'],
    watchPathIgnorePatterns: ['<rootDir>/libDev'],
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

    transformIgnorePatterns: [
        '/node_modules/(?!d3-(.*)|internmap|@walletconnect|uint8arrays|@noble)/',
    ],
    testMatch: ['**/*.test.(ts|tsx|js)'],
    transform: {
        '\\.(js|jsx|ts|tsx)$': ['@swc/jest', swcConfig],
    },
    verbose: false,
    watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
    testEnvironment: 'jsdom',
    fakeTimers: {
        enableGlobally: false,
        // https://jestjs.io/docs/28.x/upgrading-to-jest28#faketimers
        legacyFakeTimers: true,
    },
    workerIdleMemoryLimit: 0.2,
};

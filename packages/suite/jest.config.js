const baseConfig = require('../../jest.config.base');

// all tests have same UTC timezone
process.env.TZ = 'UTC';
process.env.LANG = 'en-US';

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
};

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
    coverageThreshold: {
        global: {
            statements: 49,
            branches: 35,
            lines: 49,
            functions: 46,
        },
    },
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

    transformIgnorePatterns: ['/node_modules/(?!d3-(.*)|internmap|@walletconnect|uint8arrays)/'],
    testMatch: ['**/*.test.(ts|tsx|js)'],
    transform: {
        '(d3-|internmap|esm).*\\.js$': ['babel-jest', babelConfig],
        '\\.(ts|tsx)$': ['babel-jest', babelConfig],
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

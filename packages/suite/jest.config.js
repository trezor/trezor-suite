// all tests have same UTC timezone
process.env.TZ = 'UTC';

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
    roots: ['./src'],
    setupFiles: [
        '<rootDir>/src/support/tests/setupJest.ts',
        '<rootDir>/src/support/tests/npmMocks.tsx',
        'jest-canvas-mock', // for lottie-react
    ],
    moduleNameMapper: {
        '^@suite-common/(.+)': '<rootDir>/../../suite-common/$1',
        '^@trezor/(.+)': '<rootDir>/../$1',
        '^src/(.+)': '<rootDir>/src/$1',
        '\\.(mp4)$': '<rootDir>/__mocks__/file.js',
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
    ],
    coverageThreshold: {
        global: {
            statements: 49,
            branches: 39,
            lines: 50,
            functions: 47,
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

    transformIgnorePatterns: ['/node_modules/(?!d3-(.*)|internmap)/'],
    testMatch: ['**/*.test.(ts|tsx|js)'],
    transform: {
        '(d3-|internmap).*\\.js$': ['babel-jest', babelConfig],
        '\\.(ts|tsx)$': ['babel-jest', babelConfig],
        '\\.svg$': '<rootDir>/src/support/tests/svgTransform.js', // https://stackoverflow.com/questions/46791263/jest-test-fail-syntaxerror-unexpected-token
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

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
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
    moduleNameMapper: {
        '^@suite-common/(.+)': '<rootDir>/../../suite-common/$1',
        '^@trezor/(.+)': '<rootDir>/../$1',
        '^src/(.+)': '<rootDir>/src/$1',
        '\\.(mp4)$': '<rootDir>/__mocks__/file.js',
        uuid: require.resolve('uuid'), // https://stackoverflow.com/questions/73203367/jest-syntaxerror-unexpected-token-export-with-uuid-library
    },
    moduleFileExtensions: ['js', 'ts', 'tsx'],
    coverageDirectory: './coverage',
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/src/reducers/**',
        '<rootDir>/src/utils/**',
        '<rootDir>/src/actions/**',
        '<rootDir>/src/middlewares/**',
        '<rootDir>/src/hooks/suite/useDiscovery.ts',
        '<rootDir>/src/hooks/suite/useDebounce.ts',
        '<rootDir>/src/hooks/wallet/form/useFees.ts',
        '<rootDir>/src/hooks/wallet/useRbfForm.ts',
        '<rootDir>/src/hooks/wallet/useSendForm.ts',
        '<rootDir>/src/hooks/wallet/useSendFormCompose.ts',
        '<rootDir>/src/hooks/wallet/useSendFormFields.ts',
        '<rootDir>/src/hooks/wallet/useSendFormOutputs.ts',
        // '<rootDir>/src/views/wallet/send/**',
        '!**/constants/**',
        '!**/__tests__/**',
        '!**/__fixtures__/**',
    ],
    coverageThreshold: {
        global: {
            statements: 62.5,
            branches: 50.7,
            functions: 61,
            lines: 64.2,
        },
    },
    modulePathIgnorePatterns: [
        'node_modules',
        '<rootDir>/src/utils/suite/dom',
        '<rootDir>/src/utils/wallet/promiseUtils',
        '<rootDir>/libDev',
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

// all tests have same UTC timezone
process.env.TZ = 'UTC';

module.exports = {
    roots: ['./src'],
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.json',
            // to speed up prototyping, this is how to disable ts in tests
            // diagnostics: false,
        },
    },
    setupFiles: ['<rootDir>/src/support/tests/setupJest.ts'],
    moduleNameMapper: {
        '^@suite/(.+)': '<rootDir>/src/$1',
        '^@(.+)-views/(.+)': '<rootDir>/src/views/$1/$2',
        '^@(.+)-views': '<rootDir>/src/views/$1/index',
        '^@(.+)-components/(.+)': '<rootDir>/src/components/$1/$2',
        '^@(.+)-components': '<rootDir>/src/components/$1/index',
        '^@(.+)-actions/(.+)': '<rootDir>/src/actions/$1/$2',
        '^@(.+)-actions': '<rootDir>/src/actions/$1/index',
        '^@(.+)-reducers/(.+)': '<rootDir>/src/reducers/$1/$2',
        '^@(.+)-reducers': '<rootDir>/src/reducers/$1/index',
        '^@(.+)-config/(.+)': '<rootDir>/src/config/$1/$2',
        '^@(.+)-config': '<rootDir>/src/config/$1/index',
        '^@(.+)-constants/(.+)': '<rootDir>/src/constants/$1/$2',
        '^@(.+)-constants': '<rootDir>/src/constants/$1/index',
        '^@(.+)-support/(.+)': '<rootDir>/src/support/$1/$2',
        '^@(.+)-support': '<rootDir>/src/support/$1/index',
        '^@(.+)-utils/(.+)': '<rootDir>/src/utils/$1/$2',
        '^@(.+)-utils': '<rootDir>/src/utils/$1/index',
        '^@(.+)-types/(.+)': '<rootDir>/src/types/$1/$2',
        '^@(.+)-types': '<rootDir>/src/types/$1/index',
        '^@(.+)-middlewares/(.+)': '<rootDir>/src/middlewares/$1/$2',
        '^@(.+)-middlewares': '<rootDir>/src/middlewares/$1/index',
    },
    moduleFileExtensions: ['js', 'ts', 'tsx'],
    coverageDirectory: './coverage',
    collectCoverage: true,
    collectCoverageFrom: [
        '<rootDir>/src/reducers/**',
        '<rootDir>/src/utils/**',
        '<rootDir>/src/actions/**',
        '<rootDir>/src/middlewares/**',
        '!**/constants/**',
        '!**/constants/**',
        '!**/__tests__/**',
    ],
    coverageThreshold: {
        global: {
            statements: 63.2,
            branches: 57,
            functions: 65,
            lines: 63.72,
        },
    },
    modulePathIgnorePatterns: [
        'node_modules',
        '<rootDir>/src/utils/suite/dom',
        '<rootDir>/src/utils/wallet/promiseUtils',
        '<rootDir>/src/actions/wallet/send/sendFormActions', // TODO write tests
        '<rootDir>/src/actions/wallet/send/sendFormCommonActions', // TODO write tests
        '<rootDir>/src/actions/wallet/send/sendFormBitcoinActions', // TODO write tests
        '<rootDir>/src/actions/wallet/send/sendFormEthereumActions', // TODO write tests
        '<rootDir>/src/actions/wallet/send/sendFormRippleActions', // TODO write tests
    ],
    transformIgnorePatterns: [
        '/node_modules/',
        '/node_modules/(?!intl-messageformat|intl-messageformat-parser).+\\.js$',
    ],
    testMatch: ['**/*.test.(ts|tsx|js)'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
        '^.+\\.svg$': '<rootDir>/src/support/tests/svgTransform.js', // https://stackoverflow.com/questions/46791263/jest-test-fail-syntaxerror-unexpected-token
    },
    preset: 'ts-jest',
    verbose: false,
    watchPlugins: ['jest-watch-typeahead/filename', 'jest-watch-typeahead/testname'],
};

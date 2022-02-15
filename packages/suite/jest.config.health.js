const config = require('./jest.config');

module.exports = {
    globals: {
        'ts-jest': {
            tsconfig: 'tsconfig.json',
        },
    },
    moduleNameMapper: {
        ...config.moduleNameMapper,
    },
    moduleFileExtensions: ['js', 'ts'],
    modulePathIgnorePatterns: ['node_modules', '<rootDir>/libDev'],
    testMatch: ['**/test/health/**'],
    transform: {
        '^.+\\.(ts|tsx)$': 'ts-jest',
    },
    preset: 'ts-jest',
};

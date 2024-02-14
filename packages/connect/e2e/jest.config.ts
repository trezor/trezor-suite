export default {
    rootDir: './',
    moduleFileExtensions: ['ts', 'js'],
    modulePathIgnorePatterns: ['node_modules', '__mocks__'],
    setupFilesAfterEnv: ['<rootDir>/e2e/jest.setup.js', '<rootDir>/e2e/common.setup.js'],
    globalSetup: '<rootDir>/e2e/jest.globalSetup.js',
    globalTeardown: '<rootDir>/e2e/jest.globalTeardown.js',
    transform: {
        '\\.(js|ts)$': [
            'babel-jest',
            {
                presets: [
                    ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
                    '@babel/preset-typescript',
                ],
            },
        ],
    },
    verbose: true,
    bail: true,
    testEnvironment: 'node',
    globals: {},
    watchPathIgnorePatterns: ['<rootDir>/libDev'],
    testPathIgnorePatterns: ['<rootDir>/libDev'],
};

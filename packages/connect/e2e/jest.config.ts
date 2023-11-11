export default {
    rootDir: './',
    moduleFileExtensions: ['ts', 'js'],
    modulePathIgnorePatterns: ['node_modules'],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/common.setup.js'],
    globalSetup: '<rootDir>/jest.globalSetup.js',
    globalTeardown: '<rootDir>/jest.globalTeardown.js',
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

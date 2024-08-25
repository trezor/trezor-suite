import type { Config } from 'jest';

export const config: Config = {
    rootDir: './',
    moduleFileExtensions: ['ts', 'js'],
    modulePathIgnorePatterns: ['node_modules'],
    watchPathIgnorePatterns: ['<rootDir>/libDev', '<rootDir>/lib'],
    testPathIgnorePatterns: ['<rootDir>/libDev/', '<rootDir>/lib/', '<rootDir>/e2e/api'],
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
    setupFilesAfterEnv: ['<rootDir>/e2e/bridge/testSetup.js'],
    testTimeout: 60000,
};

// eslint-disable-next-line import/no-default-export
export default config;

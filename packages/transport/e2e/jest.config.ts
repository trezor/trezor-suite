export default {
    rootDir: './',
    moduleFileExtensions: ['ts', 'js'],
    modulePathIgnorePatterns: ['node_modules'],
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
};

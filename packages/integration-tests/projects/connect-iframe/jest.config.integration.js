const babelConfig = {
    presets: [
        ['@babel/preset-env', { targets: { node: 'current' }, modules: 'commonjs' }],
        '@babel/preset-typescript',
    ],
};

module.exports = {
    rootDir: './',
    moduleFileExtensions: ['ts', 'js'],
    // todo:
    modulePathIgnorePatterns: [
        'node_modules',
        // '_old', 'src/types', 'src/ui', 'src/utils/ws.ts'
    ],
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js', '<rootDir>/common.setup.js'],
    globalSetup: '<rootDir>/jest.globalSetup.js',
    globalTeardown: '<rootDir>/jest.globalTeardown.js',
    transform: {
        // '^.+\\.js$': 'babel-jest',
        '\\.[jt]sx?$': ['babel-jest', babelConfig],

        // '\\.(ts|tsx)$': ['babel-jest', babelConfig],
    },
    transformIgnorePatterns: ['/node_modules/(?!chalk)/'],

    // collectCoverage: false,
    // coverageDirectory: './coverage/',
    // coveragePathIgnorePatterns: [
    //     '/node_modules/',
    //     '/__tests__/',
    //     '/__fixtures__/',
    // ],
    // collectCoverageFrom: ['./src/js/**/*.{js}', '!**/node_modules/**'],
    verbose: true,
    bail: true,
    testEnvironment: 'node',
};

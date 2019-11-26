/*
 * Unit tests for source with coverage
 */

module.exports = {
    rootDir: './',
    globals: {
        'ts-jest': {
            tsConfig: 'tsconfig.lib.json',
            diagnostics: {
                // 2322, 2345 - incorrect param type
                // 2554 - incorrect params length
                ignoreCodes: [2322, 2345, 2554],
            },
        },
    },
    moduleFileExtensions: ['js', 'ts', 'json'],
    testMatch: ['**/tests/unit/*.ts'],
    coverageDirectory: './coverage/',
    collectCoverage: true,
    collectCoverageFrom: ['**/src/**/*.ts'],
    modulePathIgnorePatterns: ['node_modules', '_old', 'src/types', 'src/ui', 'src/utils/ws.ts'],
    setupFiles: ['./tests/setup.js'],
    transform: {
        '^.+\\.js$': 'babel-jest',
        '^.+\\.ts$': 'ts-jest',
    },
};

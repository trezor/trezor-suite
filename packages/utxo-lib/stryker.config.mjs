export default {
    testRunner: 'jest',
    jest: { configFile: 'jest.config.stryker.cjs', enableFindRelatedTests: true },
    mutate: ['src/**/*.ts', '!src/**/*.test.ts'],
    reporters: ['clear-text', 'progress', 'json'],
    jsonReporter: { fileName: 'reports/mutation/mutation.json' },
    coverageAnalysis: 'perTest',
    timeoutMS: 10000,
    concurrency: 4,
    incremental: true,
    incrementalFile: 'reports/mutation/incremental.json',
};

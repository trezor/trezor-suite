const baseConfig = require('../../jest.config.native');

module.exports = {
    ...baseConfig,
    setupFilesAfterEnv: [require('path').resolve(__dirname, 'src/jest.afterEach.ts')],
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 80,
            functions: 80,
            lines: 80,
        },
    },
};

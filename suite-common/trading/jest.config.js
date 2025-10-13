const baseConfig = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    testEnvironment: 'jsdom',
    setupFilesAfterEnv: [require('path').resolve(__dirname, '../../packages/suite/jest.setup.js')],
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 80,
            functions: 80,
            lines: 80,
        },
    },
};

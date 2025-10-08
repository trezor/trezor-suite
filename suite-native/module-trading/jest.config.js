const baseConfig = require('../../jest.config.native');

module.exports = {
    ...baseConfig,
    workerIdleMemoryLimit: '1024MB',
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 80,
            functions: 80,
            lines: 80,
        },
    },
};

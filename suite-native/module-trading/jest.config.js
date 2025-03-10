const { ...baseConfig } = require('../../jest.config.native');

module.exports = {
    ...baseConfig,
    coverageThreshold: {
        global: {
            statements: 70,
            branches: 70,
            functions: 70,
            lines: 70,
        },
    },
};

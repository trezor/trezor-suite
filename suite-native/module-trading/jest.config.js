const baseConfig = require('../../jest.config.native');

module.exports = {
    ...baseConfig,
    setupFiles: [...baseConfig.setupFiles, '<rootDir>/src/jest.setup.tsx'],
    coverageThreshold: {
        global: {
            statements: 80,
            branches: 80,
            functions: 80,
            lines: 80,
        },
    },
};

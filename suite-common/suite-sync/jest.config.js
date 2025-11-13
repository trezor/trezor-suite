const baseConfig = require('../../jest.config.base');

// @evolu/common imports `ws` but does not necessarily run it in test context. So we just mock it.
global.WebSocket = class {};

module.exports = {
    ...baseConfig,
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    moduleNameMapper: {
        '^@evolu/common$': '<rootDir>/../../node_modules/@evolu/common/dist/src/index.js',
    },
};

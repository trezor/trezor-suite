const path = require('node:path');

const baseConfig = require('../jest.config.base');

module.exports = {
    ...baseConfig,
    rootDir: path.join(__dirname, '..'),
    roots: ['<rootDir>/eslint-local-rules'],
};

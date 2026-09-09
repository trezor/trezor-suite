const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    testEnvironment: 'node',
    roots: ['<rootDir>/usb-patch'],
};

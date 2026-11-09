const suiteSourceConfig = require('@trezor/suite/jest.sourceConfig');

const baseConfig = require('../../jest.config.base.swc');

module.exports = {
    ...baseConfig,
    ...suiteSourceConfig,
    roots: ['<rootDir>/src'],
    moduleNameMapper: {
        ...baseConfig.moduleNameMapper,
        ...suiteSourceConfig.moduleNameMapper,
    },
};

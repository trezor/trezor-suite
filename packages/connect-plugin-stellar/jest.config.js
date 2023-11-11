const baseConfig = require('../../jest.config.base');

module.exports = {
    ...baseConfig,
    moduleNameMapper: {
        axios: 'axios/dist/node/axios.cjs',
    },
};

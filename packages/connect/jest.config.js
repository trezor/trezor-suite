module.exports = {
    preset: '../../jest.config.base.js',
    // TODO: https://github.com/trezor/trezor-suite/issues/5319
    testEnvironment: 'jsdom',
    collectCoverage: true,
};

module.exports = {
    preset: '../../jest.config.base.js',
    // waiting for jest update https://github.com/trezor/trezor-suite/issues/6025
    // testEnvironment: 'node', ReferenceError: AbortController is not defined
};

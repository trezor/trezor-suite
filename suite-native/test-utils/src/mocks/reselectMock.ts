const actualReselect = require('../../../../node_modules/reselect/dist/cjs/reselect.cjs');

const IDENTITY_FUNCTION_CHECK_MESSAGE =
    'The result function returned its own inputs without modification.';
const IDENTITY_FUNCTION_CHECK_ERROR =
    'Reselect identityFunctionCheck failed: selector result function returned its input unchanged.';

type GlobalWithReselectWarnPatch = typeof globalThis & {
    __trezorReselectIdentityWarnPatched__?: boolean;
    __trezorReselectOriginalWarn__?: typeof console.warn;
};

const globalScope = globalThis as GlobalWithReselectWarnPatch;

if (!globalScope.__trezorReselectIdentityWarnPatched__) {
    const originalWarn = console.warn.bind(console);

    globalScope.__trezorReselectOriginalWarn__ = originalWarn;

    console.warn = (...warnArgs: Parameters<typeof console.warn>) => {
        const [message] = warnArgs;

        if (typeof message === 'string' && message.includes(IDENTITY_FUNCTION_CHECK_MESSAGE)) {
            throw new Error(IDENTITY_FUNCTION_CHECK_ERROR);
        }

        return originalWarn(...warnArgs);
    };

    globalScope.__trezorReselectIdentityWarnPatched__ = true;
}

module.exports = actualReselect;

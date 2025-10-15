// use native SubtleCrypto api.
// Unfortunately `crypto-browserify`.subtle polyfill is missing so needs to be referenced directly from window object (if exists)
// https://github.com/browserify/crypto-browserify/issues/221
export const getSubtleCrypto = () => {
    const subtleCrypto = typeof window !== 'undefined' ? window.crypto.subtle : crypto.subtle;
    if (!subtleCrypto) {
        throw new Error('SubtleCrypto not supported');
    }

    return subtleCrypto;
};

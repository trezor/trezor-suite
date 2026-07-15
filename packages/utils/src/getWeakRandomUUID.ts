import { getWeakRandomInt } from './getWeakRandomInt';

// Version-4 UUID template: the `4` fixes the version nibble, `y` becomes the RFC-4122 variant
// nibble (8, 9, a or b), matching the format produced by crypto.randomUUID().
const V4_TEMPLATE = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx';

/**
 * A UUID v4-shaped id generated from Math.random instead of the Web Crypto API, so it works in
 * runtimes without a `crypto` global (e.g. React Native without a polyfill). The output is
 * format-identical to crypto.randomUUID() but is NOT cryptographically random — use it only for
 * non-security-sensitive values such as request/response correlation ids. For anything that must be
 * unpredictable use crypto.randomUUID or getRandomString.
 */
export const getWeakRandomUUID = (): string =>
    V4_TEMPLATE.replace(/[xy]/g, char => {
        const nibble = getWeakRandomInt(0, 16);
        const value = char === 'x' ? nibble : (nibble & 0x3) | 0x8;

        return value.toString(16);
    });

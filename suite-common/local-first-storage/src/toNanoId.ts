import { createHash } from 'crypto';

/**
 * NanoId alphabet
 *
 * @see https://github.com/ai/nanoid/blob/main/url-alphabet/index.js
 */
export const urlAlphabet = 'useandom-26T198340PX75pxJACKVERYMINDBUSHWOLF_GQZbfghjklqvwyzrict';

const standardBase64Alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

export const toNanoId = (input: string) => {
    const keyBuffer = Buffer.from(input, 'utf-8');
    const hash = createHash('sha256').update(keyBuffer).digest('hex');

    return btoa(hash)
        .split('')
        .map(char => urlAlphabet[standardBase64Alphabet.indexOf(char)])
        .join('')
        .slice(0, 21);
};

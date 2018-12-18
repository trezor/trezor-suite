/* @flow */
/* eslint-disable */


// Simple pseudo-randomness that's based on a simple fingerprinting
// Used so the order of backends is always the same on a computer

import crypto from 'crypto';

function iisNode(): boolean {
    return typeof process !== 'undefined' && !!process.version;
}

export function uniqueRandom(maxNonInclusive: number) {
    const isNode = iisNode();
    const version = isNode
        ? process.version
        : navigator.userAgent;
    const offset = new Date().getTimezoneOffset();
    const languages = isNode
        ? 'node'
        : (
            navigator.languages == null
                ? navigator.language
                : navigator.languages.toString()
        );
    const allString = version + offset + languages;

    const hash = crypto.createHash('md5').update(allString).digest();
    let r = 0;
    for (let i = 0; i < hash.length; i++) {
        r += hash[i];
        r %= maxNonInclusive;
    }

    return r;
}

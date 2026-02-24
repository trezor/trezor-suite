import { createHash } from 'crypto';

import type { XPubHashesPerBip43Path } from '../../types';

/**
 * For cases where we want to store and compare xpubs to each other, it's better to hash them to ensure privacy.
 * This function provides a conventional way to hash them.
 */
export const calculateXPubHash = (xpub: string): string =>
    createHash('sha256').update(xpub, 'utf8').digest('hex');

export const calculateXPubHashes = (xpubs: Record<string, string>): XPubHashesPerBip43Path => {
    const hashes: XPubHashesPerBip43Path = {};
    Object.keys(xpubs).forEach(path => {
        hashes[path] = calculateXPubHash(xpubs[path]);
    });

    return hashes;
};

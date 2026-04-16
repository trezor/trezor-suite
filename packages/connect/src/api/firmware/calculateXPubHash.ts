import { createHash } from 'crypto';

import type { XPubHashesPerBip43Path } from '@trezor/connect-common';

/**
 * For cases where we want to store and compare xpubs to each other, it's better to hash them to ensure privacy.
 * This function provides a conventional way to hash them.
 */
export const calculateXPubHash = (xpub: string): string =>
    createHash('sha256').update(xpub, 'utf8').digest('hex');

export const calculateXPubHashes = (xpubs: Record<string, string>): XPubHashesPerBip43Path => {
    const hashes: XPubHashesPerBip43Path = {};
    Object.keys(xpubs).forEach(path => {
        // @ts-expect-error: indexing with noUncheckedIndexedAccess
        const xpub: string = xpubs[path];
        hashes[path] = calculateXPubHash(xpub);
    });

    return hashes;
};

type CheckXPubWithHashesParams = {
    xpub: string;
    path: string;
    knownXPubHashes: XPubHashesPerBip43Path;
};
export const checkXPubWithHashes = ({
    xpub,
    path,
    knownXPubHashes,
}: CheckXPubWithHashesParams): boolean =>
    knownXPubHashes[path] === undefined || // nothing to compare, consider as valid
    knownXPubHashes[path] === calculateXPubHash(xpub); // must match a known hash with this path

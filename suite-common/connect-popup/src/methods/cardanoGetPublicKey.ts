import { type CallMethodKeys, type CardanoPublicKey } from '@trezor/connect';

import { type PostCallHookParams } from './types';

/**
 * Connect v9 returned the Cardano extended public key (xpub) directly in the
 * `publicKey` field of `cardanoGetPublicKey`. Connect v10 unified the
 * `*GetPublicKey` response shape (trezor-suite#27299): `publicKey` now holds the
 * raw 32-byte public key, and the extended key moved to the new `xpub` /
 * `displayablePublicKey` fields.
 *
 * To keep host apps still pinned to a `9.x` version of `@trezor/connect`
 * working, rewrite `publicKey` back to the extended key for those callers.
 * Callers on a newer version receive the unified shape untouched.
 */
export function postCallHook<M extends CallMethodKeys>({
    method,
    response,
    source,
}: PostCallHookParams<M>) {
    if (
        method === 'cardanoGetPublicKey' &&
        response.success &&
        source.manifest.npmVersion?.startsWith('9.')
    ) {
        // `response` is resolved back to the calling app verbatim, so patch the
        // payload in place. Both the single and bundled (array) forms are handled.
        const bundledResponse = (
            Array.isArray(response.payload) ? response.payload : [response.payload]
        ) as CardanoPublicKey[];

        bundledResponse.forEach(item => {
            item.publicKey = item.xpub;
        });
    }

    return false;
}

export const cardanoGetPublicKeyCompat = {
    postCallHook,
};

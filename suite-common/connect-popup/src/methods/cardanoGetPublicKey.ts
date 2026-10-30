import { createAddressConfirmation } from './shared/addressConfirmation';
import { type ConnectPopupMethodDefinition, type PostCallParams } from './types';

const addressConfirmation = createAddressConfirmation<'cardanoGetPublicKey'>();

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
const patchPublicKeyForConnectV9 = ({
    response,
    source,
}: PostCallParams<'cardanoGetPublicKey'>) => {
    if (response.success && source.manifest.npmVersion?.startsWith('9.')) {
        // `response` is resolved back to the calling app verbatim, so patch the
        // payload in place. Both the single and bundled (array) forms are handled.
        const bundledResponse = Array.isArray(response.payload)
            ? response.payload
            : [response.payload];

        bundledResponse.forEach(item => {
            item.publicKey = item.xpub;
        });
    }
};

export const cardanoGetPublicKey: ConnectPopupMethodDefinition<'cardanoGetPublicKey'> = {
    ...addressConfirmation,
    postCall: async params => {
        const isCallOngoing = await addressConfirmation.postCall(params);
        patchPublicKeyForConnectV9(params);

        return isCallOngoing;
    },
};

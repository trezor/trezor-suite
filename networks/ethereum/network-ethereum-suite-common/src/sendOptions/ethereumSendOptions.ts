import {
    ETHEREUM_DATA_MAX_BYTES,
    ETHEREUM_NONCE_MAX_DIGITS,
} from '@trezor/network-ethereum/constants';
import type { SendOptions } from '@trezor/network-module-suite-common-types';

/**
 * Call data goes with coin transfers only, since a token transfer is itself a contract call. The
 * nonce can be set by hand, such as to replace a pending transaction.
 */
export const ethereumSendOptions: SendOptions = {
    data: { maxBytes: ETHEREUM_DATA_MAX_BYTES, isAllowed: ({ token }) => token === undefined },
    nonce: { maxDigits: ETHEREUM_NONCE_MAX_DIGITS },
    deferredBroadcast: true,
};

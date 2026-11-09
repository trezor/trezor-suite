import { getUnusedChangeAddress } from '@suite-common/wallet-utils';
import type {
    AccountAddresses,
    CallMethodKeys,
    CardanoPublicKey,
    PrecomposeParams,
} from '@trezor/connect';

import { type ConnectCallSource } from '../../connectPopupTypes';
import {
    type PopupFlowAnswer,
    type PopupFlowParams,
    type PopupFlowPayload,
} from '../CommonPopupFlow';

type LegacyPrecomposeParams = Omit<PrecomposeParams, 'path' | 'utxo' | 'changeAddress'> & {
    // Former `account` param, since replaced by top-level `path`, `utxo` and `changeAddress`.
    account?: Pick<PrecomposeParams, 'path' | 'utxo'> & {
        addresses: AccountAddresses;
    };
};

const isCurrentPrecomposeParams = (
    params: PrecomposeParams | LegacyPrecomposeParams,
): params is PrecomposeParams =>
    ('path' in params && !!params.path) ||
    ('utxo' in params && !!params.utxo) ||
    ('changeAddress' in params && !!params.changeAddress);

const isObject = (value: unknown): value is object => typeof value === 'object' && value !== null;

// Host apps report the version unvalidated.
export const isConnectV9Source = ({ manifest }: ConnectCallSource) =>
    typeof manifest.npmVersion === 'string' && manifest.npmVersion.startsWith('9.');

// Payloads are untrusted, deeplink ones are even arbitrary JSON. Instead of throwing, an invalid one
// is left unchanged for Connect to reject.
const applyComposeTransactionCompatibility = (
    params: PopupFlowParams<CallMethodKeys>,
): PopupFlowParams<CallMethodKeys> => {
    const payload = params.payload as PrecomposeParams | LegacyPrecomposeParams;

    if (!isObject(payload) || isCurrentPrecomposeParams(payload)) {
        return params;
    }

    const { account, ...rest } = payload;

    if (!account) {
        // Interactive flow of composeTransaction was deprecated in favour of sendTransaction.
        return { ...params, method: 'sendTransaction' };
    }

    const { path, utxo, addresses } = account;
    const changeAddresses = addresses?.change ?? [];

    if (!Array.isArray(changeAddresses) || !changeAddresses.every(isObject)) {
        return params;
    }

    const changeAddress = getUnusedChangeAddress(changeAddresses);

    return { ...params, payload: { ...rest, path, utxo, changeAddress } };
};

/**
 * Connect v10 rejects non-bitcoin coins/paths in `getPublicKey` and a `path` outside the coin type
 * of `coin` in `getAccountInfo`, which would break host apps still on `@trezor/connect` 9.x. For
 * those callers, inject `_v9_compat` so connect keeps the v9 behavior. A no-op for calls v10 accepts.
 */
const applyV9CompatFlag = (
    params: PopupFlowParams<CallMethodKeys>,
): PopupFlowParams<CallMethodKeys> => {
    if (!isConnectV9Source(params.source)) {
        return params;
    }

    const payload = params.payload as PopupFlowPayload<'getPublicKey' | 'getAccountInfo'>;

    return { ...params, payload: { ...payload, _v9_compat: true } };
};

/** Rewrites a call of a host app using a legacy API to its current form. */
export const applyRequestCompatibility = (
    params: PopupFlowParams<CallMethodKeys>,
): PopupFlowParams<CallMethodKeys> => {
    switch (params.method) {
        case 'composeTransaction':
            return applyComposeTransactionCompatibility(params);
        case 'getPublicKey':
        case 'getAccountInfo':
            return applyV9CompatFlag(params);
        default:
            return params;
    }
};

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
const applyCardanoGetPublicKeyResponseCompatibility = (
    response: PopupFlowAnswer,
): PopupFlowAnswer => {
    if (!response.success) {
        return response;
    }

    const toV9PublicKey = (publicKey: CardanoPublicKey) => ({
        ...publicKey,
        publicKey: publicKey.xpub,
    });
    // Both the single and bundled (array) forms are handled.
    const payload = response.payload as CardanoPublicKey | CardanoPublicKey[];

    return {
        ...response,
        payload: Array.isArray(payload) ? payload.map(toV9PublicKey) : toV9PublicKey(payload),
    };
};

/** Rewrites a response for a host app using a legacy API. */
export const applyResponseCompatibility = (
    params: PopupFlowParams<CallMethodKeys>,
    response: PopupFlowAnswer,
): PopupFlowAnswer =>
    params.method === 'cardanoGetPublicKey' && isConnectV9Source(params.source)
        ? applyCardanoGetPublicKeyResponseCompatibility(response)
        : response;

import { type Address, type CallMethodKeys, type PublicKey } from '@trezor/connect';
import { toFirmwareDescriptor } from '@trezor/utils';

import { connectPopupActions } from '../connectPopupActions';
import { getPermissionDeferred } from '../connectPopupPromiseManager';
import { type PostCallHookParams, type PreCallHookParams } from './types';

const methodsAddress = [
    'getAddress',
    'ethereumGetAddress',
    'cardanoGetAddress',
    'rippleGetAddress',
    'solanaGetAddress',
    'tezosGetAddress',
    'tronGetAddress',
    'stellarGetAddress',
    'moneroGetAddress',
];
const methodsPublicKey = [
    'getPublicKey',
    'ethereumGetPublicKey',
    'cardanoGetPublicKey',
    'solanaGetPublicKey',
    'tezosGetPublicKey',
];
const methods = [...methodsAddress, ...methodsPublicKey];

// `displayablePublicKey` is the per-coin canonical user-facing representation populated by
// `@trezor/connect` (xpubSegwit/xpub for Bitcoin, base58 for Solana, hex for Tezos, etc.). The
// user compares it against the device screen, which renders a taproot descriptor with `h` and a
// trailing `#<checksum>`, so reproduce firmware's whole string here. Representations without a
// key origin and without a checksum — every non-taproot one — pass through unchanged.
const toDisplayedPublicKey = ({
    displayablePublicKey,
    descriptorChecksum,
}: PublicKey & { descriptorChecksum?: string }) => {
    const firmwareDescriptor = toFirmwareDescriptor(displayablePublicKey);

    return descriptorChecksum === undefined
        ? firmwareDescriptor
        : `${firmwareDescriptor}#${descriptorChecksum}`;
};

const preCallHook = <M extends CallMethodKeys>({ method, payload }: PreCallHookParams<M>) => {
    if (methods.includes(method)) {
        if ('bundle' in payload && Array.isArray(payload.bundle)) {
            return {
                ...payload,
                bundle: payload.bundle.map(item => ({
                    ...item,
                    showOnTrezor: false,
                })),
            };
        } else {
            return {
                ...payload,
                showOnTrezor: false,
            };
        }
    }

    return payload;
};

export async function postCallHook<M extends CallMethodKeys>({
    method,
    originalPayload,
    response,
    dispatch,
}: PostCallHookParams<M>) {
    if (methods.includes(method) && response.success) {
        const bundledResponse = (
            Array.isArray(response.payload) ? response.payload : [response.payload]
        ) as (Address | (PublicKey & { descriptorChecksum?: string }))[];
        const addresses = bundledResponse.map((item, index) => {
            const validatePayload =
                'bundle' in originalPayload && Array.isArray(originalPayload.bundle)
                    ? originalPayload.bundle[index]
                    : originalPayload;
            const displayAddress = 'address' in item ? item.address : toDisplayedPublicKey(item);

            return {
                address: displayAddress,
                validated: 'not-started' as const,
                loading: false,
                validatePayload,
            };
        });
        dispatch(
            connectPopupActions.confirmAddresses({
                addresses,
                exported: false,
            }),
        );
        await getPermissionDeferred(true).promise;
        dispatch(
            connectPopupActions.confirmAddresses({
                addresses,
                exported: true,
            }),
        );

        return true;
    }

    return false;
}

export const addressConfirmationModalHooks = {
    preCallHook,
    postCallHook,
};

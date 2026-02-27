import { Address, CallMethodKeys, SolanaPublicKey } from '@trezor/connect';
import { HDNodeResponse } from '@trezor/connect/src/types/api/getPublicKey';

import { connectPopupActions } from '../connectPopupActions';
import { getPermissionDeferred } from '../connectPopupPromiseManager';
import { PostCallHookParams, PreCallHookParams } from './types';

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
        ) as Address[] | HDNodeResponse[];
        const addresses = bundledResponse.map((item, index) => {
            const validatePayload =
                'bundle' in originalPayload && Array.isArray(originalPayload.bundle)
                    ? originalPayload.bundle[index]
                    : originalPayload;
            const displayAddress = () => {
                if ('address' in item) return item.address;

                // NOTE: it's possible in some cases there will be a mismatch between the public key format on the device and the one in the app
                // For BTC
                if (method === 'getPublicKey') return item.xpubSegwit || item.xpub;
                // For SOL
                if (method === 'solanaGetPublicKey')
                    return (item as any as SolanaPublicKey).publicKeyBase58;

                // For other altcoins
                return item.publicKey;
            };

            return {
                address: displayAddress(),
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

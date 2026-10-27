import { type DeviceRootState, selectSelectedDevice } from '@suite-common/device';
import { type LockDeviceDep } from '@suite-common/suite-types';
import TrezorConnect, { type Address, type CallMethodKeys, type PublicKey } from '@trezor/connect';
import { createThunk } from '@trezor/redux-utils';

import { connectPopupActions } from '../../connectPopupActions';
import { getPermissionDeferred } from '../../connectPopupPromiseManager';
import { type ConnectPopupStateRootState, selectConnectPopupCall } from '../../connectPopupReducer';
import { CONNECT_POPUP_MODULE } from '../../connectPopupTypes';
import { type PostCallHookParams, type PreCallHookParams } from '../types';

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
        ) as (Address | PublicKey)[];
        const addresses = bundledResponse.map((item, index) => {
            const validatePayload =
                'bundle' in originalPayload && Array.isArray(originalPayload.bundle)
                    ? originalPayload.bundle[index]
                    : originalPayload;
            // `displayablePublicKey` is the per-coin canonical user-facing
            // representation populated by `@trezor/connect` (xpubSegwit/xpub for
            // Bitcoin, base58 for Solana, hex for Tezos, etc.).
            const displayAddress = 'address' in item ? item.address : item.displayablePublicKey;

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

type ConnectPopupVerifyAddressThunkState = DeviceRootState & ConnectPopupStateRootState;

type ConnectPopupVerifyAddressThunkDeps = {
    services: LockDeviceDep;
};

export const connectPopupVerifyAddressThunk = createThunk<
    void,
    { index: number },
    {
        state: ConnectPopupVerifyAddressThunkState;
        extra: ConnectPopupVerifyAddressThunkDeps;
    }
>(
    `${CONNECT_POPUP_MODULE}/verifyAddressThunk`,
    async ({ index }, { dispatch, getState, extra }) => {
        // Unlock device access from previous call
        extra.services.lockDevice(false);

        const device = selectSelectedDevice(getState());
        const call = selectConnectPopupCall(getState());
        if (!device || call?.state !== 'address-confirmation') return;
        // Device is busy with a previous verification. A second call fails with
        // Device_CallInProgress and clears the loading state of the running one.
        if (call.addresses.some(({ loading }) => loading)) return;

        // Update loading state of addresses
        dispatch(
            connectPopupActions.confirmAddresses({
                exported: call.exported,
                addresses: call.addresses?.map((address, i) => ({
                    ...address,
                    loading: i === index,
                })),
            }),
        );

        try {
            // @ts-expect-error: method is dynamic
            const res = await TrezorConnect[call.method]({
                device: {
                    path: device.path,
                    instance: device.instance,
                    state: device.state,
                    useEmptyPassphrase: device.useEmptyPassphrase,
                },
                ...call.addresses?.[index]?.validatePayload,
                showOnTrezor: true,
                chunked: false,
            });
            const validatedStatus = res.success ? 'valid' : 'failed';
            dispatch(
                connectPopupActions.confirmAddresses({
                    exported: call.exported,
                    addresses: call.addresses.map((address, i) => ({
                        ...address,
                        loading: false,
                        validated: i === index ? validatedStatus : address.validated,
                    })),
                }),
            );
        } catch (error) {
            console.error('connectPopupVerifyAddressThunk', error);
            dispatch(
                connectPopupActions.confirmAddresses({
                    exported: call.exported,
                    addresses: call.addresses.map((address, i) => ({
                        ...address,
                        loading: false,
                        validated: i === index ? 'failed' : address.validated,
                    })),
                }),
            );
        }
    },
);

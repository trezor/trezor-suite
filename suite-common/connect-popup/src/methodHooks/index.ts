import { type Dispatch } from '@reduxjs/toolkit/react';

import type { CallMethodKeys } from '@trezor/connect';

import { addressConfirmationModalHooks } from './addressConfirmation';
import { bitcoinSignTransaction } from './bitcoinSignTransaction';
import { cardanoGetPublicKeyCompat } from './cardanoGetPublicKeyCompat';
import { composeTransaction } from './composeTransaction';
import { ethereumGetPublicKeyCompat } from './ethereumGetPublicKeyCompat';
import { ethereumSignTransaction } from './ethereumSignTransaction';
import { requestLoginHooks } from './requestLogin';
import { selectAccountHooks } from './selectAccount';
import { solanaSignTransaction } from './solanaSignTransaction';
import { stellarSignTransaction } from './stellarSignTransaction';
import type {
    CompatibilityHookParams,
    CompatibilityHookResult,
    PostCallHookParams,
    PreCallHookParams,
} from './types';

/**
 * May change the method and its payload before any other actions,
 * mostly in order to preserve backwards compatibility
 */
export const compatibilityHooks = <M extends CallMethodKeys>(
    params: CompatibilityHookParams<M>,
): CompatibilityHookResult<M> =>
    composeTransaction.compatibilityHook(params) ??
    ethereumGetPublicKeyCompat.compatibilityHook(params) ??
    params;

// Runs before the permissions modal, so a call the host cannot fulfil is rejected up front.
export const validateCallHooks = <M extends CallMethodKeys>(
    params: Pick<PreCallHookParams<M>, 'method' | 'payload'>,
) => {
    selectAccountHooks.validateHook(params);
};

export const preCallHooks = async <M extends CallMethodKeys>(params: PreCallHookParams<M>) => {
    await bitcoinSignTransaction.preCallHook(params);
    await solanaSignTransaction.preCallHook(params);
    await stellarSignTransaction.preCallHook(params);

    const ethereumPayload = await ethereumSignTransaction.preCallHook(params);
    if (ethereumPayload) return ethereumPayload;

    const requestLoginPayload = requestLoginHooks.preCallHook(params);
    if (requestLoginPayload) return requestLoginPayload;

    const addressConfirmPayload = await addressConfirmationModalHooks.preCallHook(params);
    if (addressConfirmPayload) return addressConfirmPayload;

    return params.payload;
};

export async function postCallHooks<M extends CallMethodKeys>(params: PostCallHookParams<M>) {
    const hooks = [
        await bitcoinSignTransaction.postCallHook(params),
        await ethereumSignTransaction.postCallHook(params),
        await solanaSignTransaction.postCallHook(params),
        await stellarSignTransaction.postCallHook(params),
        await addressConfirmationModalHooks.postCallHook(params),
        await selectAccountHooks.postCallHook(params),
        await cardanoGetPublicKeyCompat.postCallHook(params),
    ];

    return hooks.some(Boolean);
}

// Sign hooks may create placeholder accounts in preCallHook that are normally torn down in
// postCallHook. If the call throws between the two (e.g. Device_Disconnected), postCallHook never
// runs and the module-level placeholder leaks, later causing a stale removeAccount payload. This is
// the unconditional safety net invoked from the thunk's finally so the leak cannot survive a call.
export const cleanupHooks = (dispatch: Dispatch) => {
    bitcoinSignTransaction.cleanupHook(dispatch);
    ethereumSignTransaction.cleanupHook(dispatch);
    solanaSignTransaction.cleanupHook(dispatch);
    stellarSignTransaction.cleanupHook(dispatch);
};

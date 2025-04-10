import { Dispatch } from '@reduxjs/toolkit/react';

import { PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import {
    CallMethodParams,
    CallMethodResponse,
    Success,
    TrezorConnect,
    Unsuccessful,
} from '@trezor/connect';

import { addressConfirmationModalHooks } from './addressConfirmation';
import { bitcoinSignTransaction } from './bitcoinSignTransaction';
import { ethereumSignTransaction } from './ethereumSignTransaction';
import { solanaSignTransaction } from './solanaSignTransaction';

export type PreCallHookParams<M extends keyof TrezorConnect> = {
    method: M;
    payload: Omit<CallMethodParams<M>, 'method'>;
    dispatch: Dispatch;
    getState: () => any;
    txSigningPrecomposed?: PrecomposedTransactionFinal;
};
export type PostCallHookParams<M extends keyof TrezorConnect> = PreCallHookParams<M> & {
    originalPayload: Omit<CallMethodParams<M>, 'method'>;
    response: Success<CallMethodResponse<M>> | Unsuccessful;
};

export const preCallHooks = async <M extends keyof TrezorConnect>(params: PreCallHookParams<M>) => {
    await bitcoinSignTransaction.preCallHook(params);
    await ethereumSignTransaction.preCallHook(params);
    await solanaSignTransaction.preCallHook(params);

    return await addressConfirmationModalHooks.preCallHook(params);
};

export async function postCallHooks<M extends keyof TrezorConnect>(params: PostCallHookParams<M>) {
    const hooks = [
        await bitcoinSignTransaction.postCallHook(params),
        await ethereumSignTransaction.postCallHook(params),
        await solanaSignTransaction.postCallHook(params),
        await addressConfirmationModalHooks.postCallHook(params),
    ];

    return hooks.some(Boolean);
}

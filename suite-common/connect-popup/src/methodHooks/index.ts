import { Dispatch } from '@reduxjs/toolkit/react';

import { PrecomposedTransactionFinal } from '@suite-common/wallet-types';
import {
    CallMethodKeys,
    CallMethodParams,
    CallMethodResponse,
    Success,
    Unsuccessful,
} from '@trezor/connect';

import { addressConfirmationModalHooks } from './addressConfirmation';
import { bitcoinSignTransaction } from './bitcoinSignTransaction';
import { ethereumSignTransaction } from './ethereumSignTransaction';
import { solanaSignTransaction } from './solanaSignTransaction';
import { ConnectCallSource } from '../connectPopupTypes';

export type PreCallHookParams<M extends CallMethodKeys> = {
    method: M;
    payload: Omit<CallMethodParams<M>, 'method'>;
    dispatch: Dispatch;
    getState: () => any;
    txSigningPrecomposed?: PrecomposedTransactionFinal;
    source: ConnectCallSource;
};
export type PostCallHookParams<M extends CallMethodKeys> = PreCallHookParams<M> & {
    originalPayload: Omit<CallMethodParams<M>, 'method'>;
    response: Success<CallMethodResponse<M>> | Unsuccessful;
};

export const preCallHooks = async <M extends CallMethodKeys>(params: PreCallHookParams<M>) => {
    await bitcoinSignTransaction.preCallHook(params);
    await solanaSignTransaction.preCallHook(params);

    const ethereumPayload = await ethereumSignTransaction.preCallHook(params);
    if (ethereumPayload) return ethereumPayload;

    const addressConfirmPayload = await addressConfirmationModalHooks.preCallHook(params);
    if (addressConfirmPayload) return addressConfirmPayload;

    return params.payload;
};

export async function postCallHooks<M extends CallMethodKeys>(params: PostCallHookParams<M>) {
    const hooks = [
        await bitcoinSignTransaction.postCallHook(params),
        await ethereumSignTransaction.postCallHook(params),
        await solanaSignTransaction.postCallHook(params),
        await addressConfirmationModalHooks.postCallHook(params),
    ];

    return hooks.some(Boolean);
}

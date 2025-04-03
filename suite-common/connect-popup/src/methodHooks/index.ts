import { Dispatch } from '@reduxjs/toolkit/react';

import {
    CallMethodParams,
    CallMethodResponse,
    Success,
    TrezorConnect,
    Unsuccessful,
} from '@trezor/connect';

import { addressConfirmationModalHooks } from './addressConfirmation';

export type PreCallHookParams<M extends keyof TrezorConnect> = {
    method: M;
    payload: Omit<CallMethodParams<M>, 'method'>;
    dispatch: Dispatch;
    getState: () => any;
};
export type PostCallHookParams<M extends keyof TrezorConnect> = PreCallHookParams<M> & {
    originalPayload: Omit<CallMethodParams<M>, 'method'>;
    response: Success<CallMethodResponse<M>> | Unsuccessful;
};

export const preCallHooks = async <M extends keyof TrezorConnect>(params: PreCallHookParams<M>) => {
    await addressConfirmationModalHooks.preCallHook(params);
};

export async function postCallHooks<M extends keyof TrezorConnect>(params: PostCallHookParams<M>) {
    await addressConfirmationModalHooks.postCallHook(params);
}

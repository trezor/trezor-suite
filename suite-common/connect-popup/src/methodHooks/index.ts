import { type CallMethodKeys } from '@trezor/connect';

import { addressConfirmationModalHooks } from './addressConfirmation';
import { bitcoinSignTransaction } from './bitcoinSignTransaction';
import { ethereumSignTransaction } from './ethereumSignTransaction';
import { requestLoginHooks } from './requestLogin';
import { solanaSignTransaction } from './solanaSignTransaction';
import { type PostCallHookParams, type PreCallHookParams } from './types';

export const preCallHooks = async <M extends CallMethodKeys>(params: PreCallHookParams<M>) => {
    await bitcoinSignTransaction.preCallHook(params);
    await solanaSignTransaction.preCallHook(params);

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
        await addressConfirmationModalHooks.postCallHook(params),
    ];

    return hooks.some(Boolean);
}

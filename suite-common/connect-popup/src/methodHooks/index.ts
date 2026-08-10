import { type CallMethodKeys } from '@trezor/connect';

import { addressConfirmationModalHooks } from './addressConfirmation';
import { bitcoinSignTransaction } from './bitcoinSignTransaction';
import { cardanoGetPublicKeyCompat } from './cardanoGetPublicKeyCompat';
import { ethereumGetPublicKeyCompat } from './ethereumGetPublicKeyCompat';
import { ethereumSignTransaction } from './ethereumSignTransaction';
import { requestLoginHooks } from './requestLogin';
import { selectAccountHooks } from './selectAccount';
import { solanaSignTransaction } from './solanaSignTransaction';
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
): CompatibilityHookResult<M> => ethereumGetPublicKeyCompat.compatibilityHook(params) ?? params;

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
        await selectAccountHooks.postCallHook(params),
        await cardanoGetPublicKeyCompat.postCallHook(params),
    ];

    return hooks.some(Boolean);
}

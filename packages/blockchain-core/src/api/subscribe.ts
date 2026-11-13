import type { SubscriptionAccountInfo } from '@trezor/blockchain-link-types';

import type { PostMessage } from '../backend/Blockchain';
import { initCoinBackend } from '../backend/BlockchainLink';
import { COIN_PARAMS, type CoinParams, validateParams } from '../utils/validateParams';

export type SubscribeParams = CoinParams & {
    blocks?: boolean;
    accounts?: SubscriptionAccountInfo[];
};

const validateSubscribeParams = (params: SubscribeParams) => {
    validateParams(params, [
        ...COIN_PARAMS,
        { name: 'accounts', type: 'array', allowEmpty: true },
        { name: 'blocks', type: 'boolean' },
    ]);
    params.accounts?.forEach(account =>
        validateParams(account, [{ name: 'descriptor', type: 'string', required: true }]),
    );
};

export const subscribe = async (params: SubscribeParams, postMessage: PostMessage) => {
    validateSubscribeParams(params);
    const backend = await initCoinBackend(params, postMessage);
    // Blocks are subscribed by default for backwards compatibility.
    const { blocks = true, accounts } = params;

    let result = { subscribed: false };
    if (blocks) result = await backend.subscribeBlocks();
    if (accounts) result = await backend.subscribeAccounts(accounts);

    return result;
};

export const unsubscribe = async (params: SubscribeParams, postMessage: PostMessage) => {
    validateSubscribeParams(params);
    const backend = await initCoinBackend(params, postMessage);
    const { blocks, accounts } = params;

    if (blocks) return backend.unsubscribeBlocks();
    if (accounts) return backend.unsubscribeAccounts(accounts);

    return backend.unsubscribeAll();
};

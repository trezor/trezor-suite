import type { PostMessage } from '@trezor/blockchain-core/src/backend/Blockchain';
import { initCoinBackend } from '@trezor/blockchain-core/src/backend/BlockchainLink';
import type { BlockchainLinkParams } from '@trezor/blockchain-link';
import { toCanonicalDescriptor } from '@trezor/utils';


import { COIN_PARAMS, type CoinParams, validateParams } from '../utils/validateParams';

export const getAccountBalanceHistory = async (
    params: CoinParams & BlockchainLinkParams<'getAccountBalanceHistory'>,
    postMessage: PostMessage,
) => {
    validateParams(params, [
        ...COIN_PARAMS,
        { name: 'descriptor', type: 'string', required: true },
        { name: 'from', type: 'number' },
        { name: 'to', type: 'number' },
        { name: 'groupBy', type: 'number' },
        { name: 'currencies', type: 'array' },
    ]);
    const backend = await initCoinBackend(params, postMessage);
    const { descriptor, from, to, groupBy, currencies } = params;

    return backend.getAccountBalanceHistory({
        descriptor: toCanonicalDescriptor(descriptor),
        from,
        to,
        groupBy,
        currencies,
    });
};

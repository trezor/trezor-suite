
import type { PostMessage } from '@trezor/blockchain-core/src/backend/Blockchain';
import { initCoinBackend } from '@trezor/blockchain-core/src/backend/BlockchainLink';
import type { BlockchainLinkParams } from '@trezor/blockchain-link';

import { COIN_PARAMS, type CoinParams, validateParams } from '../utils/validateParams';

export const evmRpcCall = async (
    params: CoinParams & BlockchainLinkParams<'rpcCall'>,
    postMessage: PostMessage,
) => {
    validateParams(params, [
        ...COIN_PARAMS,
        { name: 'from', type: 'string' },
        { name: 'to', type: 'string', required: true },
        { name: 'data', type: 'string', required: true },
    ]);
    const backend = await initCoinBackend(params, postMessage);
    const { from, to, data } = params;

    return backend.rpcCall({ from, to, data });
};

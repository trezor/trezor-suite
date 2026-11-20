import type { PostMessage } from '../backend/Blockchain';
import { initCoinBackend } from '../backend/BlockchainLink';
import { COIN_PARAMS, type CoinParams, validateParams } from '../utils/validateParams';

export type GetTransactionsParams = CoinParams & {
    txs: string[];
    descriptor?: string;
};

export const getTransactions = async (params: GetTransactionsParams, postMessage: PostMessage) => {
    validateParams(params, [
        ...COIN_PARAMS,
        { name: 'txs', type: 'array', required: true },
        { name: 'descriptor', type: 'string' },
    ]);
    const backend = await initCoinBackend(params, postMessage);

    return backend.getTransactions(params.txs, params.descriptor);
};

export const getRawTransactions = async (
    params: CoinParams & { txs: string[] },
    postMessage: PostMessage,
) => {
    validateParams(params, [...COIN_PARAMS, { name: 'txs', type: 'array', required: true }]);
    const backend = await initCoinBackend(params, postMessage);
    const hexes = await backend.getTransactionHexes(params.txs);

    return params.txs.map((txid, i) => ({ txid, hex: hexes[i]! }));
};

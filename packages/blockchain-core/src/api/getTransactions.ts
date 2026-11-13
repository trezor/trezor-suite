import type { Transaction } from '@trezor/blockchain-link';

import type { TrezorBlockchainResponse } from '../TrezorBlockchain';
import type { PostMessage } from '../backend/Blockchain';
import { initCoinBackend } from '../backend/BlockchainLink';
import { COIN_PARAMS, type CoinParams, validateParams } from '../utils/validateParams';

export type GetTransactionsParams = CoinParams & {
    txs: string[];
    descriptor?: string;
    hexOnly?: boolean;
};

/** TrezorBlockchain.getTransactions, whose result depends on `hexOnly`. */
export type GetTransactionsMethod = {
    (params: GetTransactionsParams & { hexOnly?: false }): TrezorBlockchainResponse<Transaction[]>;
    // Returns only raw transactions, `descriptor` is ignored.
    (
        params: GetTransactionsParams & { descriptor?: undefined; hexOnly: true },
    ): TrezorBlockchainResponse<{ txid: string; hex: string }[]>;
};

export const getTransactions = async (params: GetTransactionsParams, postMessage: PostMessage) => {
    validateParams(params, [
        ...COIN_PARAMS,
        { name: 'txs', type: 'array', required: true },
        { name: 'descriptor', type: 'string' },
        { name: 'hexOnly', type: 'boolean' },
    ]);
    const backend = await initCoinBackend(params, postMessage);

    if (params.hexOnly) {
        const hexes = await backend.getTransactionHexes(params.txs);

        return params.txs.map((txid, i) => ({ txid, hex: hexes[i]! }));
    }

    return backend.getTransactions(params.txs, params.descriptor);
};

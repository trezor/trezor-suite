import type { Transaction } from '@trezor/blockchain-link';

import type { CommonParamsWithCoin, Response } from '../../params';
import type { RawTransaction } from '../bitcoin/common';

export type BlockchainGetTransactions = CommonParamsWithCoin & {
    txs: string[];
    descriptor?: string;
    hexOnly?: false;
};

// Returns only raw transactions, `descriptor` is ignored.
export type BlockchainGetRawTransactions = CommonParamsWithCoin & {
    txs: string[];
    descriptor?: undefined;
    hexOnly: true;
};

export declare function blockchainGetTransactions(
    params: BlockchainGetTransactions,
): Response<Transaction[]>;
export declare function blockchainGetTransactions(
    params: BlockchainGetRawTransactions,
): Response<RawTransaction[]>;

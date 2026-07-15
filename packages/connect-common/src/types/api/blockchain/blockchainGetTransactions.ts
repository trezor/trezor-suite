import type { Transaction } from '@trezor/blockchain-link';

import type { CommonParamsWithCoin, Response } from '../../params';

export type BlockchainGetTransactions = CommonParamsWithCoin & {
    txs: string[];
    descriptor?: string;
};

export declare function blockchainGetTransactions(
    params: BlockchainGetTransactions,
): Response<Transaction[]>;

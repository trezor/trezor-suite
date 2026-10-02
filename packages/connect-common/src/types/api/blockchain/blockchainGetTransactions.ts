import type { Transaction } from '@trezor/blockchain-link';

import type { DeviceFreeCommonParamsWithCoin, Response } from '../../params';

export type BlockchainGetTransactions = DeviceFreeCommonParamsWithCoin & {
    txs: string[];
    descriptor?: string;
};

export declare function blockchainGetTransactions(
    params: BlockchainGetTransactions,
): Response<Transaction[]>;

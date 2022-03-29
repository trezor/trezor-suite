import type { TypedRawTransaction } from '@trezor/blockchain-link/lib/types/common'; // TODO: export from B-L
import type { BlockchainParams, Response } from '../params';

export type BlockchainGetTransactions = BlockchainParams & {
    txs: string[];
};

export declare function blockchainGetTransactions(
    params: BlockchainGetTransactions,
): Response<TypedRawTransaction[]>;

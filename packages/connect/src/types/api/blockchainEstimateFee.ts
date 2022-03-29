import type { EstimateFeeParams } from '@trezor/blockchain-link/lib/types/params'; // TODO: export from B-L
import type { FeeLevel } from '../account';
import type { BlockchainParams, Response } from '../params';

export interface BlockchainEstimateFee {
    request?: EstimateFeeParams & {
        feeLevels?: 'preloaded' | 'smart';
    };
}

export interface BlockchainEstimatedFee {
    blockTime: number;
    minFee: number;
    maxFee: number;
    levels: FeeLevel[];
    dustLimit?: number;
}

export declare function blockchainEstimateFee(
    params: BlockchainParams & BlockchainEstimateFee,
): Response<BlockchainEstimatedFee>;

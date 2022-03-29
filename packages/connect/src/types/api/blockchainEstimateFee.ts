import type { BlockchainLinkParams } from '@trezor/blockchain-link';
import type { FeeLevel } from '../account';
import type { CommonParamsWithCoin, Response } from '../params';

export interface BlockchainEstimateFee {
    request?: BlockchainLinkParams<'estimateFee'> & {
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
    params: CommonParamsWithCoin & BlockchainEstimateFee,
): Response<BlockchainEstimatedFee>;

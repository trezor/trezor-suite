import type { BlockchainLinkParams, BlockchainLinkResponse } from '@trezor/blockchain-link';
import type { FeeLevel } from '../account';
import type { CommonParamsWithCoin, Response } from '../params';

export interface BlockchainEstimateFee {
    request?: BlockchainLinkParams<'estimateFee'> & {
        feeLevels?: undefined;
    };
}

export interface BlockchainEstimateFeeLevel {
    request: BlockchainLinkParams<'estimateFee'> & {
        feeLevels: 'preloaded' | 'smart';
    };
}

interface EstimatedFee {
    blockTime: number;
    minFee: number;
    maxFee: number;
    dustLimit?: number;
}
export interface BlockchainEstimatedFee extends EstimatedFee {
    levels: BlockchainLinkResponse<'estimateFee'>;
}

export interface BlockchainEstimatedFeeLevel extends EstimatedFee {
    levels: FeeLevel[];
}

export declare function blockchainEstimateFee(
    params: CommonParamsWithCoin & BlockchainEstimateFee,
): Response<BlockchainEstimatedFee>;
export declare function blockchainEstimateFee(
    params: CommonParamsWithCoin & BlockchainEstimateFeeLevel,
): Response<BlockchainEstimatedFeeLevel>;

import type { BlockchainLinkParams, BlockchainLinkResponse } from '@trezor/blockchain-link';
import type { FeeLevel, FeeInfo } from '../fees';
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

interface EstimatedFee extends Omit<FeeInfo, 'dustLimit'> {
    dustLimit?: number; // dustLimit is set only for bitcoin-like coins
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

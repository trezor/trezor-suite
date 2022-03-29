import type { BlockchainLinkResponse } from '@trezor/blockchain-link';
import type { CommonParamsWithCoin, Response } from '../params';

export type BlockchainSubscribeFiatRates = CommonParamsWithCoin & {
    currency?: string;
};

export declare function blockchainSubscribeFiatRates(
    params: BlockchainSubscribeFiatRates,
): Response<BlockchainLinkResponse<'subscribe'>>;

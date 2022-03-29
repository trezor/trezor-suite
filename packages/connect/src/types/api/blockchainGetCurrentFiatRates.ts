import type { BlockchainLinkParams, BlockchainLinkResponse } from '@trezor/blockchain-link';
import type { CommonParamsWithCoin, Response } from '../params';

export declare function blockchainGetCurrentFiatRates(
    params: CommonParamsWithCoin & BlockchainLinkParams<'getCurrentFiatRates'>,
): Response<BlockchainLinkResponse<'getCurrentFiatRates'>>;

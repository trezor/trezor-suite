import type { BlockchainLinkParams, BlockchainLinkResponse } from '@trezor/blockchain-link';
import type { CommonParamsWithCoin, Response } from '../params';

export declare function blockchainGetAccountBalanceHistory(
    params: CommonParamsWithCoin & BlockchainLinkParams<'getAccountBalanceHistory'>,
): Response<BlockchainLinkResponse<'getAccountBalanceHistory'>>;

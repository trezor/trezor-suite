import type { BlockchainLinkParams, BlockchainLinkResponse } from '@trezor/blockchain-link';

import type { DeviceFreeCommonParamsWithCoin, Response } from '../../params';

export declare function blockchainGetAccountBalanceHistory(
    params: DeviceFreeCommonParamsWithCoin & BlockchainLinkParams<'getAccountBalanceHistory'>,
): Response<BlockchainLinkResponse<'getAccountBalanceHistory'>>;

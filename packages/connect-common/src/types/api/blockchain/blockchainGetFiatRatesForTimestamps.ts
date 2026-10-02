import type { BlockchainLinkParams, BlockchainLinkResponse } from '@trezor/blockchain-link';

import type { DeviceFreeCommonParamsWithCoin, Response } from '../../params';

export declare function blockchainGetFiatRatesForTimestamps(
    params: DeviceFreeCommonParamsWithCoin & BlockchainLinkParams<'getFiatRatesForTimestamps'>,
): Response<BlockchainLinkResponse<'getFiatRatesForTimestamps'>>;

import type { BlockchainLinkParams, BlockchainLinkResponse } from '@trezor/blockchain-link';

import type { DeviceFreeCommonParamsWithCoin, Response } from '../../params';

export declare function blockchainGetCurrentFiatRates(
    params: DeviceFreeCommonParamsWithCoin & BlockchainLinkParams<'getCurrentFiatRates'>,
): Response<BlockchainLinkResponse<'getCurrentFiatRates'>>;

import type { BlockchainLinkResponse } from '@trezor/blockchain-link';

import type { DeviceFreeCommonParamsWithCoin, Response } from '../../params';

export type BlockchainSubscribeFiatRates = DeviceFreeCommonParamsWithCoin & {
    currency?: string;
};

export declare function blockchainSubscribeFiatRates(
    params: BlockchainSubscribeFiatRates,
): Response<BlockchainLinkResponse<'subscribe'>>;

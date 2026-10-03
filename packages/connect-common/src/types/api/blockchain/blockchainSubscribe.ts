import type { BlockchainLinkResponse, SubscriptionAccountInfo } from '@trezor/blockchain-link';

import type { DeviceFreeCommonParamsWithCoin, Response } from '../../params';

export type BlockchainSubscribe = DeviceFreeCommonParamsWithCoin & {
    blocks?: boolean;
    accounts?: SubscriptionAccountInfo[];
};

export declare function blockchainSubscribe(
    params: BlockchainSubscribe,
): Response<BlockchainLinkResponse<'subscribe'>>;

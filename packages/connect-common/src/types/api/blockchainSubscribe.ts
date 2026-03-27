import type { BlockchainLinkResponse } from '@trezor/blockchain-link';
import type { SubscriptionAccountInfo } from '@trezor/blockchain-link-types';

import type { CommonParamsWithCoin, Response } from '../params';

export type BlockchainSubscribe = CommonParamsWithCoin & {
    blocks?: boolean;
    accounts?: SubscriptionAccountInfo[];
};

export declare function blockchainSubscribe(
    params: BlockchainSubscribe,
): Response<BlockchainLinkResponse<'subscribe'>>;

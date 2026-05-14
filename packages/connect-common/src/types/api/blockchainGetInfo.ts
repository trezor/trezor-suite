import type { BlockchainLinkResponse } from '@trezor/blockchain-link';

import type { CommonParamsWithCoin, Response } from '../params';

export declare function blockchainGetInfo(
    params: CommonParamsWithCoin,
): Response<BlockchainLinkResponse<'getInfo'>>;

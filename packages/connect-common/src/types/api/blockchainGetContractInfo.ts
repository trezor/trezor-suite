import type { BlockchainLinkResponse } from '@trezor/blockchain-link';

import type { CommonParamsWithCoin, Response } from '../params';

export declare function blockchainGetContractInfo(
    params: CommonParamsWithCoin & { contract: string; currency?: string; protocols?: string[] },
): Response<BlockchainLinkResponse<'getContractInfo'>>;

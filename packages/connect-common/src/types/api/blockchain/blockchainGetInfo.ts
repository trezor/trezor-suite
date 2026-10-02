import type { BlockchainLinkResponse } from '@trezor/blockchain-link';

import type { DeviceFreeCommonParamsWithCoin, Response } from '../../params';

export declare function blockchainGetInfo(
    params: DeviceFreeCommonParamsWithCoin,
): Response<BlockchainLinkResponse<'getInfo'>>;

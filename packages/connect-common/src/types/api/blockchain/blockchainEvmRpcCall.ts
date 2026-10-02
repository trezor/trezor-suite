import type { BlockchainLinkParams, BlockchainLinkResponse } from '@trezor/blockchain-link';

import type { DeviceFreeCommonParamsWithCoin, Response } from '../../params';

export declare function blockchainEvmRpcCall(
    params: DeviceFreeCommonParamsWithCoin & BlockchainLinkParams<'rpcCall'>,
): Response<BlockchainLinkResponse<'rpcCall'>>;

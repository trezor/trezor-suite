import { BlockchainLinkParams, BlockchainLinkResponse } from '@trezor/blockchain-link';
import type { CommonParamsWithCoin, Response } from '../params';

export declare function blockchainEvmRpcCall(
    params: CommonParamsWithCoin & BlockchainLinkParams<'rpcCall'>,
): Response<BlockchainLinkResponse<'rpcCall'>>;

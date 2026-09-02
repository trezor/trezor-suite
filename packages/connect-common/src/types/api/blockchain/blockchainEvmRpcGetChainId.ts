import type { CommonParams, Response } from '../../params';

export type BlockchainEvmRpcGetChainId = CommonParams & {
    url: string;
};

export declare function blockchainEvmRpcGetChainId(
    params: BlockchainEvmRpcGetChainId,
): Response<{ chainId: number }>;

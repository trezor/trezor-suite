import type { DeviceFreeCommonParams, Response } from '../../params';

export type BlockchainEvmRpcGetChainId = DeviceFreeCommonParams & {
    url: string;
};

export declare function blockchainEvmRpcGetChainId(
    params: BlockchainEvmRpcGetChainId,
): Response<{ chainId: number }>;

import type { CommonParams, Response } from '../params';

export type BlockchainValidateEvmRpcUrl = CommonParams & {
    url: string;
    chainId: number;
};

export declare function blockchainValidateEvmRpcUrl(params: BlockchainValidateEvmRpcUrl): Response<{
    valid: boolean;
    actualChainId?: number;
}>;

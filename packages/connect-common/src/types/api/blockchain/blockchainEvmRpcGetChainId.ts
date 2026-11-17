import type { CommonParams, Response } from '../../params';

export type BlockchainEvmRpcGetChainId = CommonParams & {
    url: string;
    /** Also samples recent blocks for the average block time; slower, so opt-in. */
    measureBlockTime?: boolean;
};

export declare function blockchainEvmRpcGetChainId(params: BlockchainEvmRpcGetChainId): Response<{
    chainId: number;
    /** Average block time in seconds, absent when not requested or not measurable. */
    blockTimeSeconds?: number;
}>;

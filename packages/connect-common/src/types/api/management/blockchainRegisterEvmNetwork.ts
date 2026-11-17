import type { CommonParams, Response } from '../../params';

export type BlockchainRegisterEvmNetwork = CommonParams & {
    symbol: string;
    name: string;
    chainId: number;
    rpcUrls: string[];
    testnet?: boolean;
    /** Average block time in seconds, as measured by `blockchainEvmRpcGetChainId`. */
    blockTimeSeconds?: number;
};

export declare function blockchainRegisterEvmNetwork(
    params: BlockchainRegisterEvmNetwork,
): Response<{ symbol: string }>;

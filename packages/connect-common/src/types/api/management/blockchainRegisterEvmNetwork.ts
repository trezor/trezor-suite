import type { CommonParams, Response } from '../../params';

export type BlockchainRegisterEvmNetwork = CommonParams & {
    symbol: string;
    name: string;
    chainId: number;
    rpcUrls: string[];
    testnet?: boolean;
};

export declare function blockchainRegisterEvmNetwork(
    params: BlockchainRegisterEvmNetwork,
): Response<{ symbol: string }>;

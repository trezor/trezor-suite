import type { CommonParams, Response } from '../../params';

export type RegisterEvmNetwork = CommonParams & {
    symbol: string;
    name: string;
    chainId: number;
};

export declare function registerEvmNetwork(
    params: RegisterEvmNetwork,
): Response<{ symbol: string }>;

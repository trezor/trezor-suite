import type { CommonParamsWithCoin, Response } from '../params';

export declare function blockchainDisconnect(
    params: CommonParamsWithCoin,
): Response<{ disconnected: boolean }>;

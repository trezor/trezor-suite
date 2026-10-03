import type { DeviceFreeCommonParamsWithCoin, Response } from '../../params';

export declare function blockchainDisconnect(
    params: DeviceFreeCommonParamsWithCoin,
): Response<{ disconnected: boolean }>;

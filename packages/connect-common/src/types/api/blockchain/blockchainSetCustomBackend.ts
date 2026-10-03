import type { BlockchainLink, CoinSymbol } from '../../coinInfo';
import type { DeviceFreeCommonParams, Response } from '../../params';

export type BlockchainSetCustomBackend = DeviceFreeCommonParams & {
    coin: CoinSymbol;
    blockchainLink?: BlockchainLink;
};

export declare function blockchainSetCustomBackend(
    params: BlockchainSetCustomBackend,
): Response<boolean>;

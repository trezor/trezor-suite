import type { BlockchainLink, CoinSymbol } from '../../coinInfo';
import type { CommonParams, Response } from '../../params';

export type BlockchainSetCustomBackend = CommonParams & {
    coin: CoinSymbol;
    blockchainLink?: BlockchainLink;
};

export declare function blockchainSetCustomBackend(
    params: BlockchainSetCustomBackend,
): Response<boolean>;

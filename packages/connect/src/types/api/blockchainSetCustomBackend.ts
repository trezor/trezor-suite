import type { CommonParams, Response } from '../params';
import type { BlockchainLink } from '../coinInfo';

export type BlockchainSetCustomBackend = CommonParams & {
    coin: string;
    blockchainLink?: BlockchainLink;
};

export declare function blockchainSetCustomBackend(
    params: BlockchainSetCustomBackend,
): Response<boolean>;

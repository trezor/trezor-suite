import type { BlockchainLink } from '../coinInfo';
import type { CommonParams, Response } from '../params';

export type BlockchainSetCustomBackend = CommonParams & {
    coin: string;
    blockchainLink?: BlockchainLink;
};

export declare function blockchainSetCustomBackend(
    params: BlockchainSetCustomBackend,
): Response<boolean>;

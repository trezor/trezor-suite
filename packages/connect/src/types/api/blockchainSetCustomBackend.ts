import type { CommonParamsWithCoin, Response } from '../params';
import type { BlockchainLink } from '../coinInfo';

export type BlockchainSetCustomBackend = CommonParamsWithCoin & {
    blockchainLink?: BlockchainLink;
};

export declare function blockchainSetCustomBackend(
    params: BlockchainSetCustomBackend,
): Response<boolean>;

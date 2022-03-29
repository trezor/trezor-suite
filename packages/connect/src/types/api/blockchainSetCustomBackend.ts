import type { BlockchainParams, Response } from '../params';
import type { BlockchainLink } from '../coinInfo';

export type BlockchainSetCustomBackend = BlockchainParams & {
    blockchainLink?: BlockchainLink;
};

export declare function blockchainSetCustomBackend(
    params: BlockchainSetCustomBackend,
): Response<boolean>; // TODO: response same as protobuf success?

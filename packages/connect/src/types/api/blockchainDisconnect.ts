import type { BlockchainParams, Response } from '../params';

// TODO: re-export from B-L
export interface BlockchainDisconnected {
    disconnected: boolean; // TODO: same as protobuf.Success?
}

export declare function blockchainDisconnect(
    params: BlockchainParams,
): Response<BlockchainDisconnected>;

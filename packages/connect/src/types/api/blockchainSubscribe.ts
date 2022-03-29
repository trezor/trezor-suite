import type { SubscriptionAccountInfo } from '@trezor/blockchain-link/lib/types/common'; // TODO: export from B-L
import type { Subscribe } from '@trezor/blockchain-link/lib/types/responses'; // TODO: export from B-L
import type { BlockchainParams, Response } from '../params';

export type BlockchainSubscribe = BlockchainParams & {
    accounts?: SubscriptionAccountInfo[];
};

export declare function blockchainSubscribe(
    params: BlockchainSubscribe,
): Response<Subscribe['payload']>;

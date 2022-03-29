import type { Subscribe } from '@trezor/blockchain-link/lib/types/responses'; // TODO: export from B-L
import type { BlockchainParams, Response } from '../params';

export type BlockchainSubscribeFiatRates = BlockchainParams & {
    currency?: string;
};

export declare function blockchainSubscribeFiatRates(
    params: BlockchainSubscribeFiatRates,
): Response<Subscribe>;

// TODO: candidate to merge with blockchainSubscribe

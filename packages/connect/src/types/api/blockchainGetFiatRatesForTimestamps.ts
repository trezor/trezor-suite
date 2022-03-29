import type { GetFiatRatesForTimestampsParams } from '@trezor/blockchain-link/lib/types/params'; // TODO: export from B-L
import type { GetFiatRatesForTimestamps } from '@trezor/blockchain-link/lib/types/responses'; // TODO: export from B-L
import type { BlockchainParams, Response } from '../params';

export declare function blockchainGetFiatRatesForTimestamps(
    params: BlockchainParams & GetFiatRatesForTimestampsParams,
): Response<GetFiatRatesForTimestamps['payload']['tickers']>;

// TODO: candidate to merge with BlockchainGetFiatRates

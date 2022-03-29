import type { GetCurrentFiatRatesParams } from '@trezor/blockchain-link/lib/types/params'; // TODO: export from B-L
import type { GetCurrentFiatRates } from '@trezor/blockchain-link/lib/types/responses'; // TODO: export from B-L
import type { BlockchainParams, Response } from '../params';

export declare function blockchainGetCurrentFiatRates(
    params: BlockchainParams & GetCurrentFiatRatesParams,
): Response<GetCurrentFiatRates['payload']>;

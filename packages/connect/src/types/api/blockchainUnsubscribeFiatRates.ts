import type { Unsubscribe } from '@trezor/blockchain-link/lib/types/responses'; // TODO: export from B-L
import type { Response } from '../params';
import type { BlockchainSubscribeFiatRates } from './blockchainSubscribeFiatRates';

export declare function blockchainUnsubscribeFiatRates(
    params: BlockchainSubscribeFiatRates,
): Response<Unsubscribe>;

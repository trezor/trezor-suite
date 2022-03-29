import type { Unsubscribe } from '@trezor/blockchain-link/lib/types/responses'; // TODO: export from B-L
import type { Response } from '../params';
import type { BlockchainSubscribe } from './blockchainSubscribe';

export declare function blockchainUnsubscribe(
    params: BlockchainSubscribe,
): Response<Unsubscribe['payload']>;

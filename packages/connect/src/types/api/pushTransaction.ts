/**
 * Bitcoin, Bitcoin-like, Ethereum-like, Ripple
 * Broadcasts the transaction to the selected network.
 */
import { Static, Type } from '@trezor/schema-utils';
import type { Params, Response } from '../params';

export type PushTransaction = Static<typeof PushTransaction>;
export const PushTransaction = Type.Object({
    tx: Type.String(),
    coin: Type.String(),
});

// push transaction response
export interface PushedTransaction {
    txid: string;
}

export declare function pushTransaction(
    params: Params<PushTransaction>,
): Response<PushedTransaction>;

// TODO: rename to blockchainPushTransaction ?

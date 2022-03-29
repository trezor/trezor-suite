/**
 * Bitcoin, Bitcoin-like, Ethereum-like, Ripple
 * Broadcasts the transaction to the selected network.
 */
import type { Params, Response } from '../params';

export type PushTransaction = {
    tx: string;
    coin: string;
};

// push transaction response
export interface PushedTransaction {
    txid: string;
}

export declare function pushTransaction(
    params: Params<PushTransaction>,
): Response<PushedTransaction>;

// TODO: rename to blockchainPushTransaction ?

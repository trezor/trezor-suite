import type { Transaction } from '@trezor/blockchain-link-types';
import type { NetworkSymbol } from '@trezor/network-module-types';

import type { BackendType } from '../SuiteCommonNetworkConfig';
import type { ChainAccountRef } from './ChainAccountRef';

/**
 * Where an account's transactions stand on a network that orders them by a number per account
 * (EVM nonces). Networks without one (Bitcoin, Solana, Sui) have no account nonce.
 */
export type ChainAccountNonce = {
    /** The lowest nonce a transaction can still use: every lower one is mined. */
    readonly confirmedNonce: number;

    /** The nonce the next transaction takes, past the account's pending transactions. */
    readonly nextNonce: number;

    /** Nonces of the account's transactions waiting to be mined, ascending. */
    readonly pendingNonces: readonly number[];
};

export type GetAccountNonceParams = {
    ref: ChainAccountRef;
    signal: AbortSignal;
};

export type ChainPendingSendsParams = {
    symbol: NetworkSymbol;
    backendType: BackendType;
    descriptor: string;
};

export type GetChainPendingSendsDep = {
    /**
     * Transactions the wallet broadcast from the account that its backend may not list yet,
     * newest first. Read from what the app keeps; never fetched.
     */
    getChainPendingSends: (params: ChainPendingSendsParams) => readonly Transaction[];
};

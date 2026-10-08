import type { GetTrezorConnectDep } from '@trezor/connect-common';
import {
    type ChainAccountRef,
    ChainNetworkError,
    toCoinSymbol,
} from '@trezor/network-module-suite-common-types';

import type { EvmNonceReading } from './combineEvmAccountNonce';

export type EvmNonceAccount = Pick<ChainAccountRef, 'symbol' | 'descriptor' | 'connectionIdentity'>;

/** Reads an account's nonce from the network's backend. */
export type ReadEvmNonce = (account: EvmNonceAccount) => Promise<EvmNonceReading>;

type ReadConnectEvmNonceDeps = GetTrezorConnectDep<'getAccountInfo'>;

export type ReadBlockbookEvmNonceDeps = ReadConnectEvmNonceDeps;
export type ReadBlockbookEvmNonce = ReadEvmNonce;

export type ReadEvmRpcNonceDeps = ReadConnectEvmNonceDeps;
export type ReadEvmRpcNonce = ReadEvmNonce;

const parseNonce = (value: unknown, account: EvmNonceAccount) => {
    const nonce = typeof value === 'string' && /^\d+$/.test(value) ? Number(value) : NaN;
    // A nonce the backend did not give is never guessed: signing with it could replace a send.
    if (!Number.isSafeInteger(nonce))
        throw new ChainNetworkError('account-info-failed', account.symbol);

    return nonce;
};

const getAccountInfo = async (
    deps: ReadConnectEvmNonceDeps,
    account: EvmNonceAccount,
    confirmedNonce: boolean,
) => {
    const result = await deps.getTrezorConnect().getAccountInfo({
        coin: toCoinSymbol(account.symbol),
        descriptor: account.descriptor,
        details: 'basic',
        suppressBackupWarning: true,
        identity: account.connectionIdentity,
        confirmedNonce,
    });

    // The backend message can echo the descriptor, so it is dropped here.
    if (!result.success) throw new ChainNetworkError('account-info-failed', account.symbol);

    return result.payload;
};

/**
 * Blockbook counts pending transactions in its nonce and, on newer versions, also returns the
 * mined-only count (trezor/blockbook#1562).
 */
export const createReadBlockbookEvmNonce =
    (deps: ReadBlockbookEvmNonceDeps): ReadBlockbookEvmNonce =>
    async account => {
        const { misc } = await getAccountInfo(deps, account, true);

        return {
            pendingNonce: parseNonce(misc?.nonce, account),
            confirmedNonce:
                misc?.confirmedNonce == null ? undefined : parseNonce(misc.confirmedNonce, account),
        };
    };

/**
 * Connect's JSON-RPC backend returns the mined-only count as the nonce, and the transactions
 * waiting in the node's mempool as unconfirmed.
 */
export const createReadEvmRpcNonce =
    (deps: ReadEvmRpcNonceDeps): ReadEvmRpcNonce =>
    async account => {
        const { misc, history } = await getAccountInfo(deps, account, false);
        const confirmedNonce = parseNonce(misc?.nonce, account);
        const unconfirmed = Number.isSafeInteger(history.unconfirmed) ? history.unconfirmed : 0;

        return { confirmedNonce, pendingNonce: confirmedNonce + Math.max(unconfirmed, 0) };
    };

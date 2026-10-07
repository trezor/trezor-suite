import type { Transaction } from '@trezor/blockchain-link-types';
import { type Result, ok } from '@trezor/type-utils';

import { isPendingTransaction } from './accountState';
import type { SignedEthereumSweepRecord } from './ethereumSweepLedger';
import type { BackendError, EthereumBackend } from '../backend/backend';
import type { EthereumSweepPlan } from '../ethereum/composeEthereumSweep';
import { type EthereumAddressInfo, toEthereumAddressInfo } from '../ethereum/ethereumAccountInfo';

export type EthereumSweepStatus =
    /** The transaction is mined and succeeded. */
    | 'confirmed'
    /** The transaction is in the mempool. The device must not be updated or wiped yet. */
    | 'pending'
    /** The backend does not know the transaction and the nonce is still unused: re-send it. */
    | 'not-in-mempool'
    /** The transaction was mined but reverted. The nonce and the fee are spent, the funds stay. */
    | 'failed'
    /** The backend does not know the transaction, yet the nonce moved or something is pending. */
    | 'unknown';

/** Nothing more happens to a transfer in one of these states. */
export const isFinalEthereumSweepStatus = (status: EthereumSweepStatus | undefined) =>
    status === 'confirmed' || status === 'failed';

export type EvaluateEthereumSweepStatusParams = {
    /** The signed transaction as the backend reports it, or undefined when it does not know it. */
    transaction?: Transaction;
    info: EthereumAddressInfo;
    plan: EthereumSweepPlan;
};

/**
 * Finds out what became of a signed transfer. The transaction is looked up by its id, which
 * nobody can alter, and the address state tells whether its nonce is still free to be re-sent.
 */
export const evaluateEthereumSweepStatus = ({
    transaction,
    info,
    plan,
}: EvaluateEthereumSweepStatusParams): EthereumSweepStatus => {
    if (transaction) {
        if (isPendingTransaction(transaction)) return 'pending';

        return transaction.ethereumSpecific?.status === 0 ? 'failed' : 'confirmed';
    }

    const isNonceUnused = info.nonce === String(plan.nonce);

    return isNonceUnused && info.unconfirmedTransactions === 0 ? 'not-in-mempool' : 'unknown';
};

export type LoadEthereumSweepStatusParams = {
    backend: EthereumBackend;
    record: SignedEthereumSweepRecord;
};

/** Looks the transfer up on the backend. Fails only when the address state cannot be read. */
export const loadEthereumSweepStatus = async ({
    backend,
    record,
}: LoadEthereumSweepStatusParams): Promise<Result<EthereumSweepStatus, BackendError>> => {
    const accountInfo = await backend.getAccountInfo(record.plan.account.address);
    if (!accountInfo.success) return accountInfo;

    // An error here means the backend does not know the transaction. Whether that makes the
    // transfer re-sendable is decided by the address state, read from the same backend.
    const transaction = await backend.getTransaction(record.txid);

    return ok(
        evaluateEthereumSweepStatus({
            transaction: transaction.success ? transaction.payload : undefined,
            info: toEthereumAddressInfo(accountInfo.payload),
            plan: record.plan,
        }),
    );
};

export type BroadcastEthereumSweepParams = {
    backend: EthereumBackend;
    record: SignedEthereumSweepRecord;
};

/**
 * Broadcasts the stored signed transaction. Calling it again after a failure re-sends the very
 * same bytes; a failed broadcast is never a reason to sign anew.
 */
export const broadcastEthereumSweep = ({ backend, record }: BroadcastEthereumSweepParams) =>
    backend.pushTransaction(record.hex);

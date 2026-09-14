import { rpc, type xdr } from '@stellar/stellar-sdk';

import { resolveAfter } from '@trezor/utils';

import {
    STELLAR_RPC_SUBMIT_POLL_INTERVAL_MS,
    STELLAR_RPC_SUBMIT_POLL_TIMEOUT_MS,
    STELLAR_RPC_SUBMIT_RETRY_ATTEMPTS,
    STELLAR_RPC_SUBMIT_RETRY_DELAY_MS,
} from '../../constants';
import type { StellarTransaction } from '../../types';
import type { StellarRpcServer } from '../../types/rpc';

const UNKNOWN_RESULT_CODE = 'unknown';

// Only `txFailed`/`txSuccess` carry per-operation results, so the read is guarded, not branched
// over each of the two dozen codes.
const readOperationResultCode = (result: xdr.TransactionResult) => {
    try {
        const inner = result.result;

        if (inner.type !== 'txSuccess' && inner.type !== 'txFailed') {
            return UNKNOWN_RESULT_CODE;
        }

        const [operation] = inner.results;

        if (!operation) {
            return UNKNOWN_RESULT_CODE;
        }

        if (operation.type !== 'opInner') {
            return operation.type;
        }

        return operation.tr.value?.type ?? UNKNOWN_RESULT_CODE;
    } catch {
        return UNKNOWN_RESULT_CODE;
    }
};

/**
 * Formats a rejected submission the way the Horizon path did, so downstream handling and the
 * message the user sees keep their shape. The codes are now XDR enum names (`txBadSeq`) rather than
 * Horizon's snake_case spelling (`tx_bad_seq`).
 */
export const toSubmitError = (result: xdr.TransactionResult | undefined, cause?: unknown) => {
    const transactionCode = result ? result.result.type : UNKNOWN_RESULT_CODE;
    const operationCode = result ? readOperationResultCode(result) : UNKNOWN_RESULT_CODE;

    return Object.assign(
        new Error(
            `transaction result code: ${transactionCode}, operation result code: ${operationCode}`,
        ),
        { cause },
    );
};

/**
 * Horizon answered a resubmitted transaction by replaying the stored result, so a send that had
 * already landed reported as sent. Over RPC the same resubmission says nothing about the
 * transaction that applied: its sequence number is spent, so core rejects it as `txBadSeq`, or the
 * node reports congestion because it still holds the original. Asking for it by hash is what tells
 * an already-applied send apart from one that never made it.
 */
const hasAlreadyApplied = async (server: StellarRpcServer, hash: string) => {
    try {
        const { status } = await server.getTransaction(hash);

        return status === rpc.Api.GetTransactionStatus.SUCCESS;
    } catch {
        return false;
    }
};

const sendWithRetry = async (server: StellarRpcServer, transaction: StellarTransaction) => {
    let response = await server.sendTransaction(transaction);

    for (
        let attempt = 1;
        attempt <= STELLAR_RPC_SUBMIT_RETRY_ATTEMPTS && response.status === 'TRY_AGAIN_LATER';
        attempt++
    ) {
        // Waiting out congestion only helps while the transaction is still to be applied; one the
        // network already has would keep answering the same for as long as we asked.
        if (await hasAlreadyApplied(server, response.hash)) break;

        // The node is congested rather than the transaction being invalid.
        await resolveAfter(STELLAR_RPC_SUBMIT_RETRY_DELAY_MS * attempt);
        response = await server.sendTransaction(transaction);
    }

    return response;
};

// `sendTransaction` answers PENDING as soon as the node accepts the envelope, so apply-time
// failures — which Horizon's blocking `submitTransaction` reported synchronously — only show by
// polling. Past the budget the transaction is valid and in flight, so Suite tracks it by hash.
const pollForApplyResult = async (server: StellarRpcServer, hash: string) => {
    const deadline = Date.now() + STELLAR_RPC_SUBMIT_POLL_TIMEOUT_MS;

    for (;;) {
        // A poll that fails says nothing about the transaction: the node accepted it, so a proxy
        // hiccup a second later must not be reported as a failed send.
        const result = await server.getTransaction(hash).catch(() => undefined);

        if (result?.status === rpc.Api.GetTransactionStatus.FAILED) {
            throw toSubmitError(result.resultXdr);
        }

        if (result?.status === rpc.Api.GetTransactionStatus.SUCCESS || Date.now() >= deadline) {
            return hash;
        }

        await resolveAfter(STELLAR_RPC_SUBMIT_POLL_INTERVAL_MS);
    }
};

export interface SubmitTransactionParams {
    server: StellarRpcServer;
    transaction: StellarTransaction;
}

/** Submits a signed transaction and resolves with its hash once it has been applied. */
export const submitTransaction = async ({
    server,
    transaction,
}: SubmitTransactionParams): Promise<string> => {
    const response = await sendWithRetry(server, transaction);

    // `PENDING` and `DUPLICATE` are the statuses that mean the node holds the transaction; every
    // other one is a rejection.
    if (response.status !== 'PENDING' && response.status !== 'DUPLICATE') {
        // A transaction that already applied looks exactly like a rejection on the way back in:
        // its sequence number is spent, so core answers `txBadSeq`, or the node reports congestion
        // because it still holds the original. The ledger has the last word before we call it a
        // failed send.
        if (await hasAlreadyApplied(server, response.hash)) return response.hash;

        if (response.status === 'ERROR') {
            throw toSubmitError(response.errorResult, response);
        }

        // Nothing was queued, so polling would spend the whole budget on `NOT_FOUND` and then hand
        // back the hash of a send that never happened.
        throw Object.assign(
            new Error(`Stellar RPC did not accept the transaction: ${response.status}`),
            { cause: response },
        );
    }

    return pollForApplyResult(server, response.hash);
};

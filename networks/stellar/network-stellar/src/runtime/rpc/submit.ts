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

// Only `txFailed`/`txSuccess` carry per-operation results.
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

/** Keeps the Horizon-era error shape; the codes are XDR enum names like `txBadSeq`. */
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
 * A resubmitted transaction that already applied comes back as `txBadSeq` or as congestion;
 * asking for it by hash is what tells it apart from a send that never made it.
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
        if (await hasAlreadyApplied(server, response.hash)) break;

        await resolveAfter(STELLAR_RPC_SUBMIT_RETRY_DELAY_MS * attempt);
        response = await server.sendTransaction(transaction);
    }

    return response;
};

// `PENDING` only means accepted, so apply-time failures show up by polling `getTransaction`.
const pollForApplyResult = async (server: StellarRpcServer, hash: string) => {
    const deadline = Date.now() + STELLAR_RPC_SUBMIT_POLL_TIMEOUT_MS;

    for (;;) {
        // A failed poll says nothing about a transaction the node already accepted.
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

export type SubmitTransactionParams = {
    server: StellarRpcServer;
    transaction: StellarTransaction;
};

/** Submits a signed transaction and resolves with its hash once it has been applied. */
export const submitTransaction = async ({
    server,
    transaction,
}: SubmitTransactionParams): Promise<string> => {
    const response = await sendWithRetry(server, transaction);

    if (response.status !== 'PENDING' && response.status !== 'DUPLICATE') {
        // An already-applied transaction looks like a rejection here; the ledger has the last word.
        if (await hasAlreadyApplied(server, response.hash)) return response.hash;

        if (response.status === 'ERROR') {
            throw toSubmitError(response.errorResult, response);
        }

        // Nothing was queued, so polling would only spend the budget on `NOT_FOUND`.
        throw Object.assign(
            new Error(`Stellar RPC did not accept the transaction: ${response.status}`),
            { cause: response },
        );
    }

    return pollForApplyResult(server, response.hash);
};

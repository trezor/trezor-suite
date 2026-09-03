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

// Only `txFailed`/`txSuccess` carry per-operation results, and the accessors throw for every
// other arm, so the read is guarded rather than branched on each of the two dozen codes.
const readOperationResultCode = (result: xdr.TransactionResult) => {
    try {
        const [operation] = result.result().results();

        if (!operation) {
            return UNKNOWN_RESULT_CODE;
        }

        if (operation.switch().name !== 'opInner') {
            return operation.switch().name;
        }

        return operation.tr().value()?.switch().name ?? UNKNOWN_RESULT_CODE;
    } catch {
        return UNKNOWN_RESULT_CODE;
    }
};

/**
 * Formats a rejected submission the way the Horizon path did, so downstream handling and the
 * message the user sees keep their shape. The codes themselves are now XDR enum names
 * (`txBadSeq`) rather than Horizon's snake_case spelling (`tx_bad_seq`).
 */
export const toSubmitError = (result: xdr.TransactionResult | undefined, cause?: unknown) => {
    const transactionCode = result ? result.result().switch().name : UNKNOWN_RESULT_CODE;
    const operationCode = result ? readOperationResultCode(result) : UNKNOWN_RESULT_CODE;

    return Object.assign(
        new Error(
            `transaction result code: ${transactionCode}, operation result code: ${operationCode}`,
        ),
        { cause },
    );
};

const sendWithRetry = async (server: StellarRpcServer, transaction: StellarTransaction) => {
    let response = await server.sendTransaction(transaction);

    for (
        let attempt = 1;
        attempt <= STELLAR_RPC_SUBMIT_RETRY_ATTEMPTS && response.status === 'TRY_AGAIN_LATER';
        attempt++
    ) {
        // The node is congested rather than the transaction being invalid.
        await resolveAfter(STELLAR_RPC_SUBMIT_RETRY_DELAY_MS * attempt);
        response = await server.sendTransaction(transaction);
    }

    return response;
};

// `sendTransaction` answers PENDING as soon as the node accepts the envelope, so apply-time
// failures — which Horizon's blocking `submitTransaction` reported synchronously — are only
// visible by polling. Past the budget the transaction is valid and in flight, so the hash is
// returned and Suite tracks it from there.
const pollForApplyResult = async (server: StellarRpcServer, hash: string) => {
    const deadline = Date.now() + STELLAR_RPC_SUBMIT_POLL_TIMEOUT_MS;

    for (;;) {
        const result = await server.getTransaction(hash);

        if (result.status === rpc.Api.GetTransactionStatus.FAILED) {
            throw toSubmitError(result.resultXdr);
        }

        if (result.status === rpc.Api.GetTransactionStatus.SUCCESS || Date.now() >= deadline) {
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

    if (response.status === 'ERROR') {
        throw toSubmitError(response.errorResult, response);
    }

    return pollForApplyResult(server, response.hash);
};

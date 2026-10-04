import { verifyTx } from '@trezor/connect-core/src/api/bitcoin/signtxVerify';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { type Result, err, ok } from '@trezor/type-utils';
import { bufferUtils } from '@trezor/utils';
import type { Transaction } from '@trezor/utxo-lib';

import { BITCOIN_NETWORK } from './bitcoinNetwork';
import type { SweepPlan } from './composeSweep';

export type SignedSweepError = {
    type: 'signed-transaction-invalid';
    reason: string;
};

export type SignedSweep = {
    hex: string;
    /** Informational only. Third parties can change the id of a legacy transaction. */
    txid: string;
};

const EXPECTED_VERSION = 1;
const EXPECTED_LOCKTIME = 0;
const FINAL_SEQUENCE = 0xffffffff;

export type VerifySignedSweepParams = {
    serializedTx: string;
    plan: SweepPlan;
};

/**
 * Checks that the transaction returned by the device is the one that was composed: same inputs,
 * and exactly one output paying the destination script the composed amount.
 */
export const verifySignedSweep = ({
    serializedTx,
    plan,
}: VerifySignedSweepParams): Result<SignedSweep, SignedSweepError> => {
    const invalid = (reason: string) =>
        err({ type: 'signed-transaction-invalid' as const, reason });

    // The shared schema types an external output as PAYTOADDRESS only, while firmware older
    // than 1.5.0 needs PAYTOSCRIPTHASH for a P2SH destination. The helper reads just the amount.
    const outputs = [plan.output as PROTO.TxOutputType];

    let transaction: Transaction;
    try {
        transaction = verifyTx(serializedTx, {
            inputs: plan.inputs,
            outputs,
            outputScripts: [plan.destination.script],
            network: BITCOIN_NETWORK,
        });
    } catch (error) {
        return invalid(error instanceof Error ? error.message : 'verification failed');
    }

    const [output, ...otherOutputs] = transaction.outs;
    if (!output || otherOutputs.length > 0) return invalid('not exactly one output');
    if (!output.script.equals(plan.destination.script)) return invalid('output script differs');
    if (BigInt(output.value) !== BigInt(plan.amount)) return invalid('output amount differs');

    if (transaction.version !== EXPECTED_VERSION) return invalid('unexpected version');
    if (transaction.locktime !== EXPECTED_LOCKTIME) return invalid('unexpected lock time');

    if (transaction.ins.length !== plan.inputs.length) return invalid('input count differs');

    for (const [index, signedInput] of transaction.ins.entries()) {
        const plannedInput = plan.inputs[index];
        const signedHash = bufferUtils.reverseBuffer(signedInput.hash).toString('hex');

        const isPlannedOutpoint =
            plannedInput?.prev_hash.toLowerCase() === signedHash &&
            plannedInput.prev_index === signedInput.index;
        if (!isPlannedOutpoint) return invalid('input outpoint differs');

        if (signedInput.sequence !== FINAL_SEQUENCE) return invalid('unexpected input sequence');

        const isSigned = signedInput.script.length > 0 || signedInput.witness.length > 0;
        if (!isSigned) return invalid('input is not signed');
    }

    return ok({ hex: transaction.toHex(), txid: transaction.getId() });
};

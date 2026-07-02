// Assemble the MoneroTransactionData (tsx_data) + MoneroTransactionSourceEntry[] that drive
// moneroSignTransaction. This is the "marshal" step: it takes the wallet's owned outputs (with
// their chosen decoy rings) plus the recipient destinations, computes the change, and lays
// everything out in the exact shapes the device validates.
//
// Constants (rsig_type / bp_version / hard_fork / client_version) match the current
// BulletproofPlus protocol as used by the connect moneroSignTransaction fixtures.
import { type DestinationEntry, buildDestination } from './destination';
import { type RingOutput, buildRing } from './ring';

const RSIG_TYPE_BULLETPROOF_PLUS = 1;
const BP_PLUS_VERSION = 4;
const HARD_FORK = 16;
const CLIENT_VERSION = 3;
const TSX_DATA_VERSION = 1;
const BULLETPROOF_PLUS_MAX_OUTPUTS = 16;

/** One owned output the wallet is spending, with the decoys chosen for its ring. */
export interface OwnedInput {
    amount: number;
    real: RingOutput;
    decoys: RingOutput[];
    /** Mask (commitment blinding) of the real output, hex. */
    mask: string;
    /** Public tx key of the transaction that created this output, hex. */
    realOutTxKey: string;
    realOutAdditionalTxKeys?: string[];
    /** Index of this output within its source transaction. */
    realOutputInTxIndex: number;
    /** Subaddress minor index the output was received on (0 for the main address). */
    subaddrMinor: number;
}

export interface SourceEntry {
    outputs: { idx: number; key: { dest: string; commitment: string } }[];
    real_output: number;
    real_out_tx_key: string;
    real_out_additional_tx_keys: string[];
    real_output_in_tx_index: number;
    amount: number;
    rct: boolean;
    mask: string;
    subaddr_minor: number;
}

export interface TransactionData {
    version: number;
    payment_id?: string;
    unlock_time: number;
    outputs: DestinationEntry[];
    change_dts?: DestinationEntry;
    num_inputs: number;
    mixin: number;
    fee: number;
    account: number;
    rsig_data: { rsig_type: number; bp_version: number; grouping: number[] };
    client_version: number;
    hard_fork: number;
}

export interface ComposeParams {
    inputs: OwnedInput[];
    destinations: { address: string; amount: number }[];
    /** The wallet's own primary address, where any change is sent. */
    changeAddress: string;
    fee: number;
    account?: number;
    unlockTime?: number;
    paymentId?: string;
}

export interface ComposedTransaction {
    tsxData: TransactionData;
    inputs: SourceEntry[];
}

// Piconero amounts span the full 2^64 range, but this layer carries them as JS numbers (matching
// the Type.Uint protobuf fields). Above Number.MAX_SAFE_INTEGER (~9007 XMR) integer arithmetic
// silently loses precision, so reject such amounts loudly instead of computing a wrong change.
const assertSafeAmount = (value: number, label: string): void => {
    if (!Number.isSafeInteger(value) || value < 0) {
        throw new Error(
            `compose: ${label} must be a non-negative integer below 2^53 piconero (got ${value})`,
        );
    }
};

export const composeMoneroTransaction = (params: ComposeParams): ComposedTransaction => {
    if (params.inputs.length === 0) {
        throw new Error('compose: at least one input is required');
    }

    params.inputs.forEach((input, i) => assertSafeAmount(input.amount, `input[${i}].amount`));
    params.destinations.forEach((dest, i) =>
        assertSafeAmount(dest.amount, `destination[${i}].amount`),
    );
    assertSafeAmount(params.fee, 'fee');

    const inputs: SourceEntry[] = params.inputs.map(input => {
        const { outputs, realOutput } = buildRing(input.real, input.decoys);

        return {
            outputs,
            real_output: realOutput,
            real_out_tx_key: input.realOutTxKey,
            real_out_additional_tx_keys: input.realOutAdditionalTxKeys ?? [],
            real_output_in_tx_index: input.realOutputInTxIndex,
            amount: input.amount,
            rct: true,
            mask: input.mask,
            subaddr_minor: input.subaddrMinor,
        };
    });

    // Every ring must have the same size (mixin + 1).
    const ringSize = inputs[0]!.outputs.length;
    if (inputs.some(input => input.outputs.length !== ringSize)) {
        throw new Error('compose: all inputs must share the same ring size');
    }

    const inputTotal = params.inputs.reduce((sum, input) => sum + input.amount, 0);
    const sendTotal = params.destinations.reduce((sum, dest) => sum + dest.amount, 0);
    // The per-amount checks above don't bound their sums, which can themselves overflow 2^53.
    assertSafeAmount(inputTotal, 'inputs total');
    assertSafeAmount(sendTotal, 'destinations total');
    const change = inputTotal - sendTotal - params.fee;
    if (change < 0) {
        throw new Error('compose: inputs do not cover destinations + fee');
    }

    const recipientOutputs = params.destinations.map(dest =>
        buildDestination(dest.address, dest.amount),
    );
    // wallet2 never emits a single-output RingCT tx (consensus + BulletproofPlus require >= 2
    // outputs). When the inputs cover destinations + fee exactly (change === 0) and there is only one
    // recipient, append a 0-amount change output to the wallet's own address. The fee already budgets
    // a change output upstream (send/compose size the fee for destinations + 1), so this is free and
    // leaves the normal change > 0 path byte-for-byte unchanged.
    const needsDummyChange = change === 0 && recipientOutputs.length < 2;
    const changeDts =
        change > 0 || needsDummyChange ? buildDestination(params.changeAddress, change) : undefined;

    // tsx_data.outputs lists ALL outputs (recipients + the change); change_dts is just a reference the
    // device uses to recognise which one is the change. Leaving the change out of `outputs` makes the
    // device see one output and reject the transaction ("at least two outputs are required").
    const outputs = changeDts ? [...recipientOutputs, changeDts] : recipientOutputs;
    const numOutputs = outputs.length;
    if (numOutputs < 2) {
        throw new Error('compose: a transaction needs at least two outputs');
    }
    if (numOutputs > BULLETPROOF_PLUS_MAX_OUTPUTS) {
        // A single aggregated BulletproofPlus is limited; splitting into groups is not handled yet.
        throw new Error(
            `compose: more than ${BULLETPROOF_PLUS_MAX_OUTPUTS} outputs is not supported`,
        );
    }

    const tsxData: TransactionData = {
        version: TSX_DATA_VERSION,
        unlock_time: params.unlockTime ?? 0,
        outputs,
        change_dts: changeDts,
        num_inputs: inputs.length,
        mixin: ringSize - 1,
        fee: params.fee,
        account: params.account ?? 0,
        rsig_data: {
            rsig_type: RSIG_TYPE_BULLETPROOF_PLUS,
            bp_version: BP_PLUS_VERSION,
            grouping: [numOutputs],
        },
        client_version: CLIENT_VERSION,
        hard_fork: HARD_FORK,
        ...(params.paymentId ? { payment_id: params.paymentId } : {}),
    };

    return { tsxData, inputs };
};

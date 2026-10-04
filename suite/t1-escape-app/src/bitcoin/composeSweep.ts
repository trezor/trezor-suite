import type { Utxo } from '@trezor/blockchain-link-types';
import { inputToTrezor } from '@trezor/connect-core/src/api/bitcoin/inputs';
import type { MessagesSchema as PROTO } from '@trezor/protobuf';
import { type Result, err, ok } from '@trezor/type-utils';
import { address as addressUtils, composeTx } from '@trezor/utxo-lib';
import {
    INPUT_SCRIPT_LENGTH,
    getFeeForBytes,
    inputBytes,
} from '@trezor/utxo-lib/src/coinselect/coinselectUtils';

import { ACCOUNT_TYPE_DEFINITIONS, type AccountType } from './accountType';
import { BITCOIN_DUST_LIMIT, BITCOIN_NETWORK } from './bitcoinNetwork';
import type { Destination } from './destinationAddress';
import { getOutpointKey } from './outpoint';
import { isConfirmedUtxo } from './utxo';
import {
    type FirmwareVersion,
    getDestinationOutputScriptType,
    isDestinationFormatSupported,
} from '../firmware/firmwareSupport';

/**
 * The one fee rate of the migration, in satoshi per virtual byte. No backend estimate is used:
 * the backend is not trusted, and a constant keeps the fee predictable. It must stay at or below
 * `MAX_SWEEP_FEE_RATE`, above which firmware 1.3.6-1.4.2 shows a "fee over threshold" warning.
 */
export const SWEEP_FEE_RATE = 50;

/** Fee rate no composed transaction may exceed. Composition fails rather than overpay. */
export const MAX_SWEEP_FEE_RATE = 100;

/** Old firmware streams every previous transaction, so the input count is kept modest. */
export const MAX_SWEEP_INPUTS = 50;

/**
 * Largest number of satoshi added on top of the fixed fee to make each amount unique. Within a
 * page session uniqueness is guaranteed. Across a reload nothing is remembered, so the range
 * also keeps the chance low that a recomposed transfer repeats an amount shown before.
 */
export const MAX_FEE_PADDING = 64;

const MINIMAL_COINBASE_CONFIRMATIONS = 100;

/** Destination output a device input can be signed against. */
export type SweepOutput = {
    address: string;
    amount: string;
    script_type: PROTO.OutputScriptType;
};

export type SweepPlan = {
    accountType: AccountType;
    /** UTXOs spent by the transaction, in the order of `inputs`. */
    utxos: Utxo[];
    inputs: PROTO.TxInputType[];
    /** The single output of the transaction. A sweep has no change and no second output. */
    output: SweepOutput;
    destination: Destination;
    amount: string;
    fee: string;
    /** Random satoshi included in `fee` on top of the fixed-rate fee. */
    feePadding: number;
    virtualSize: number;
};

export type LeftoverReason =
    /** The output is not confirmed yet. Unconfirmed outputs are never spent. */
    | 'unconfirmed'
    /** A mined reward that cannot be spent before it has 100 confirmations. */
    | 'immature-coinbase'
    /** Spending the output would cost at least as much as it is worth. */
    | 'uneconomic'
    /** The outputs together do not cover the fee of the transaction that would move them. */
    | 'insufficient-for-fee';

export type Leftover = {
    utxo: Utxo;
    reason: LeftoverReason;
};

export type ComposeSweepError =
    | { type: 'no-spendable-utxos' }
    | { type: 'insufficient-for-fee' }
    | { type: 'invalid-utxo' }
    | { type: 'compose-failed'; reason: string }
    | { type: 'invariant-violated'; invariant: string }
    | { type: 'amount-not-unique' };

/** Fee, in satoshi, that one more input of the given account type adds to a transaction. */
export const getInputCost = (accountType: AccountType) =>
    getFeeForBytes(
        SWEEP_FEE_RATE,
        inputBytes({ type: accountType, script: { length: INPUT_SCRIPT_LENGTH[accountType] } }),
    );

const compareByAmountDescending = (left: Utxo, right: Utxo) => {
    const difference = BigInt(right.amount) - BigInt(left.amount);
    if (difference !== 0n) return difference > 0n ? 1 : -1;

    // Equal amounts are ordered by outpoint to keep the selection deterministic.
    return getOutpointKey(left).localeCompare(getOutpointKey(right));
};

const getLeftoverReason = (utxo: Utxo, inputCost: bigint): LeftoverReason | undefined => {
    if (!isConfirmedUtxo(utxo)) return 'unconfirmed';

    if (utxo.coinbase && utxo.confirmations < MINIMAL_COINBASE_CONFIRMATIONS) {
        return 'immature-coinbase';
    }

    if (BigInt(utxo.amount) <= inputCost) return 'uneconomic';

    return undefined;
};

export type SweepBatches = {
    /** Groups of at most `MAX_SWEEP_INPUTS` UTXOs. Each group becomes one transaction. */
    batches: Utxo[][];
    leftovers: Leftover[];
};

export type PlanSweepBatchesParams = {
    utxos: readonly Utxo[];
    accountType: AccountType;
};

/**
 * Splits the UTXOs of one account into the transactions that will sweep them, largest amounts
 * first, and sets aside what cannot or should not be spent. The UTXOs must be well-formed.
 */
export const planSweepBatches = ({ utxos, accountType }: PlanSweepBatchesParams): SweepBatches => {
    const inputCost = BigInt(getInputCost(accountType));
    const spendable: Utxo[] = [];
    const leftovers: Leftover[] = [];

    utxos.forEach(utxo => {
        const reason = getLeftoverReason(utxo, inputCost);
        if (reason) {
            leftovers.push({ utxo, reason });
        } else {
            spendable.push(utxo);
        }
    });

    const sorted = spendable.toSorted(compareByAmountDescending);
    const batches: Utxo[][] = [];
    for (let start = 0; start < sorted.length; start += MAX_SWEEP_INPUTS) {
        batches.push(sorted.slice(start, start + MAX_SWEEP_INPUTS));
    }

    return { batches, leftovers };
};

export type ComposeSweepParams = {
    /** Confirmed, economic UTXOs of a single account, at most `MAX_SWEEP_INPUTS` of them. */
    utxos: readonly Utxo[];
    accountType: AccountType;
    destination: Destination;
    firmwareVersion: FirmwareVersion;
    /** Output amounts of every sweep composed earlier in this page session. */
    usedAmounts: ReadonlySet<string>;
    /** Returns a random integer from `min` (inclusive) to `max` (exclusive). */
    getRandomInt: (min: number, max: number) => number;
};

const sumAmounts = (utxos: readonly Utxo[]) =>
    utxos.reduce((sum, utxo) => sum + BigInt(utxo.amount), 0n);

const isDestinationConsistent = ({ address, script }: Destination) => {
    try {
        return addressUtils.toOutputScript(address, BITCOIN_NETWORK).equals(script);
    } catch {
        return false;
    }
};

type ComposeWithPaddingParams = Omit<ComposeSweepParams, 'usedAmounts' | 'getRandomInt'> & {
    feePadding: number;
};

const composeWithPadding = ({
    utxos,
    accountType,
    destination,
    firmwareVersion,
    feePadding,
}: ComposeWithPaddingParams): Result<SweepPlan, ComposeSweepError> => {
    const violated = (invariant: string) => err({ type: 'invariant-violated' as const, invariant });

    if (!isDestinationFormatSupported(firmwareVersion, destination.format)) {
        return violated('firmware can pay to the destination format');
    }
    if (!isDestinationConsistent(destination)) {
        return violated('destination script matches address');
    }

    const composed = composeTx({
        txType: accountType,
        utxos: utxos.map(utxo => ({
            ...utxo,
            coinbase: utxo.coinbase ?? false,
            own: true,
            // Every UTXO handed in must be spent. Selection already happened in the caller.
            required: true,
        })),
        outputs: [{ type: 'send-max', address: destination.address }],
        feeRate: SWEEP_FEE_RATE,
        baseFee: feePadding,
        network: BITCOIN_NETWORK,
        // The composer insists on a change address even though a send-max transaction never
        // has change. Pointing it at the destination means that not even a composer bug could
        // route funds back to the old wallet. The absence of change is asserted below.
        changeAddress: { address: destination.address },
        dustThreshold: BITCOIN_DUST_LIMIT,
        sortingStrategy: 'bip69',
    });

    if (composed.type === 'error') {
        return composed.error === 'NOT-ENOUGH-FUNDS'
            ? err({ type: 'insufficient-for-fee' })
            : err({ type: 'compose-failed', reason: composed.error });
    }

    if (composed.type !== 'final') return violated('composition is final');

    const [output, ...otherOutputs] = composed.outputs;
    if (!output || otherOutputs.length > 0) return violated('exactly one output');
    if (output.type !== 'payment') return violated('no change output');
    if (output.address !== destination.address) return violated('output pays the destination');

    const requestedOutpoints = new Set(utxos.map(getOutpointKey));
    const composedOutpoints = new Set(composed.inputs.map(getOutpointKey));
    const spendsExactlyRequested =
        composed.inputs.length === utxos.length &&
        composedOutpoints.size === utxos.length &&
        requestedOutpoints.size === utxos.length &&
        [...composedOutpoints].every(outpoint => requestedOutpoints.has(outpoint));
    if (!spendsExactlyRequested) return violated('inputs are exactly the selected outputs');

    const amount = BigInt(output.amount);
    const fee = sumAmounts(composed.inputs) - amount;
    const fixedRateFee = BigInt(getFeeForBytes(SWEEP_FEE_RATE, composed.bytes));
    if (amount <= 0n) return violated('positive amount');
    if (fee !== BigInt(composed.fee)) return violated('fee equals inputs minus output');
    if (fee !== fixedRateFee + BigInt(feePadding)) {
        return violated('fee is fixed rate plus padding');
    }
    if (fee > BigInt(getFeeForBytes(MAX_SWEEP_FEE_RATE, composed.bytes))) {
        return violated('fee below the cap');
    }

    let inputs: PROTO.TxInputType[];
    try {
        // The helper leaves `sequence` at its default: final and without replace-by-fee.
        inputs = composed.inputs.map(utxo => inputToTrezor(utxo));
    } catch {
        return err({ type: 'invalid-utxo' });
    }

    const expectedScriptType = ACCOUNT_TYPE_DEFINITIONS[accountType].inputScriptType;
    if (inputs.some(input => input.script_type !== expectedScriptType)) {
        return violated('inputs belong to one account type');
    }

    return ok({
        accountType,
        utxos: composed.inputs,
        inputs,
        output: {
            address: destination.address,
            amount: amount.toString(),
            script_type: getDestinationOutputScriptType(firmwareVersion, destination.format),
        },
        destination,
        amount: amount.toString(),
        fee: fee.toString(),
        feePadding,
        virtualSize: composed.bytes,
    });
};

/**
 * Composes the transaction that sweeps the given UTXOs of one account to the destination.
 *
 * The result always has a single output and no change, pays the fixed fee rate plus a few random
 * satoshi, and sends an amount that differs from every amount in `usedAmounts`. The last property
 * lets the user follow the rule "never confirm the same address with the same amount twice" even
 * when an interrupted signing has to be repeated.
 */
export const composeSweep = ({
    usedAmounts,
    getRandomInt,
    ...params
}: ComposeSweepParams): Result<SweepPlan, ComposeSweepError> => {
    const { utxos } = params;
    if (utxos.length === 0) return err({ type: 'no-spendable-utxos' });
    if (utxos.length > MAX_SWEEP_INPUTS) {
        return err({ type: 'invariant-violated', invariant: 'input count within the limit' });
    }

    const firstPadding = getRandomInt(1, MAX_FEE_PADDING + 1);

    for (let attempt = 0; attempt < MAX_FEE_PADDING; attempt++) {
        // Walk through all paddings starting at the random one. Every padding produces a
        // different amount, so a collision with an earlier amount is resolved by the next.
        const feePadding = ((firstPadding - 1 + attempt) % MAX_FEE_PADDING) + 1;
        const plan = composeWithPadding({ ...params, feePadding });

        if (!plan.success || !usedAmounts.has(plan.payload.amount)) return plan;
    }

    return err({ type: 'amount-not-unique' });
};

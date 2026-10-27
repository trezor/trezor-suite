import { MAX_RECURSION_DEPTH } from './constants';
import {
    type AnalysisCoin,
    type AnalysisTransaction,
    type ForeignVirtualOutput,
    type WalletVirtualCoin,
} from './transaction';

/** `CoinjoinAnalyzer.AmountWithAnonymity`. */
export interface AmountWithAnonymity {
    anonymity: number;
    amount: number;
}

/** `CoinjoinAnalyzer.AggregationFunction`. */
export type AggregationFunction = (values: readonly AmountWithAnonymity[]) => number;

/** `CoinjoinAnalyzer.Min`. */
export const min: AggregationFunction = values =>
    values.length > 0 ? Math.min(...values.map(x => x.anonymity)) : 0;

/**
 * `CoinjoinAnalyzer.WeightedMean`.
 *
 * `LinqExtensions.WeightedMean` sums `value * weight` over the sequence in order and
 * divides by the sum of the weights, also in order. All IEEE-754 double arithmetic, which
 * JavaScript reproduces exactly as long as the summation order is the same.
 */
export const weightedMean: AggregationFunction = values => {
    if (values.length === 0) {
        return 0;
    }
    const weightedSum = values.reduce((total, x) => total + x.anonymity * x.amount, 0);
    const weightSum = values.reduce((total, x) => total + x.amount, 0);

    return weightedSum / weightSum;
};

/**
 * Port of `WalletWasabi/Blockchain/Analysis/CoinjoinAnalyzer.cs`.
 *
 * Stateful: the input sanction cache is per analyzed transaction, as upstream's is.
 */
export class CoinjoinAnalyzer {
    private readonly analyzedTransactionPrevOuts: Set<string>;
    private readonly cachedInputSanctions = new Map<AnalysisCoin, number>();

    constructor(readonly analyzedTransaction: AnalysisTransaction) {
        this.analyzedTransactionPrevOuts = new Set(
            analyzedTransaction.inputs.map(input => input.outpoint),
        );
    }

    /** `ComputeInputSanction(WalletVirtualInput, AggregationFunction)`. */
    computeVirtualInputSanction(
        virtualInput: WalletVirtualCoin,
        aggregationFunction: AggregationFunction,
    ): number {
        return Math.max(
            ...virtualInput.coins.map(coin => this.computeInputSanction(coin, aggregationFunction)),
        );
    }

    /** `ComputeInputSanction(SmartCoin, AggregationFunction)`. */
    computeInputSanction(
        transactionInput: AnalysisCoin,
        aggregationFunction: AggregationFunction,
    ): number {
        const helper = (transactionOutput: AnalysisCoin, recursionDepth = 1): number => {
            if (recursionDepth > MAX_RECURSION_DEPTH) {
                return 0;
            }

            // If we already analyzed the sanction for this output, then return the cached
            // result.
            const cached = this.cachedInputSanctions.get(transactionOutput);
            if (cached !== undefined) {
                return cached;
            }

            // Look at the transaction containing transactionOutput. We are searching for
            // any transaction inputs of the analyzed transaction that might have come from
            // this transaction. If we find such remixed outputs, then we determine how
            // much they contributed to our anonymity set.
            const { transaction } = transactionOutput;
            let sanction = -computeAnonymityContribution(
                transactionOutput,
                this.analyzedTransactionPrevOuts,
            );

            // Recursively branch out into all of the transaction inputs' histories and
            // compute the sanction for each branch. Add the worst-case branch to the
            // resulting sanction.
            sanction += aggregationFunction(
                transaction.walletInputs.map(x => ({
                    anonymity: helper(x, recursionDepth + 1),
                    amount: x.amount,
                })),
            );

            this.cachedInputSanctions.set(transactionOutput, sanction);

            return sanction;
        };

        return helper(transactionInput);
    }
}

/**
 * `CoinjoinAnalyzer.ComputeAnonymityContribution`.
 *
 * How much the foreign outputs of the analyzed transaction contribute to the anonymity of
 * `transactionOutput`. When `relevantOutpoints` is given, only foreign outputs that
 * overlap it count.
 */
export const computeAnonymityContribution = (
    transactionOutput: AnalysisCoin,
    relevantOutpoints?: ReadonlySet<string>,
): number => {
    const CONSIDER_SCRIPT_TYPES = true;
    const { transaction } = transactionOutput;
    const { walletVirtualOutputs } = transaction;
    const { foreignVirtualOutputs } = transaction;

    const owning = walletVirtualOutputs.find(o =>
        o.coins.some(c => c.outpoint === transactionOutput.outpoint),
    );
    if (owning === undefined) {
        throw new Error('Sequence contains no matching element.');
    }
    const { amount } = owning;

    const isRelevantVirtualOutput = (output: ForeignVirtualOutput) =>
        relevantOutpoints === undefined ||
        [...output.outpoints].some(outpoint => relevantOutpoints.has(outpoint));
    const hasRelevantScriptType = (output: ForeignVirtualOutput) =>
        CONSIDER_SCRIPT_TYPES ? output.scriptType === transactionOutput.scriptType : true;

    // Count the outputs that have the same value as our transactionOutput.
    const equalValueWalletVirtualOutputCount = walletVirtualOutputs.filter(
        o => o.amount === amount,
    ).length;
    const equalValueForeignRelevantVirtualOutputCount = foreignVirtualOutputs
        .filter(o => o.amount === amount && hasRelevantScriptType(o))
        .filter(isRelevantVirtualOutput).length;

    // The anonymity set should increase by the number of equal-valued foreign outputs. If
    // we have multiple equal-valued wallet outputs, then the increase is divided evenly
    // between them: picking randomly an output would make our anonset total/ours, i.e.
    // 1 + foreign/ours.
    return equalValueForeignRelevantVirtualOutputCount / equalValueWalletVirtualOutputCount;
};

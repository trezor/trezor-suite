import {
    type AggregationFunction,
    type AmountWithAnonymity,
    CoinjoinAnalyzer,
    computeAnonymityContribution,
    min,
    weightedMean,
} from './coinjoinAnalyzer';
import { DEFAULT_HIGH_ANONYMITY_SET, MAXIMUM_NUMBER_OF_SATOSHIS, isStdDenom } from './constants';
import {
    type AnalysisPubKey,
    type AnalysisTransaction,
    type WalletVirtualCoin,
} from './transaction';

/**
 * Port of `WalletWasabi/Blockchain/Analysis/StartingAnonScores.cs`.
 *
 * Three starting scores, each as a `(standard, sanctioned)` pair.
 */
export interface StartingAnonScores {
    /** Derived from all the inputs; goes as low as the lowest input's anonymity score. */
    minimum: { standard: number; sanctioned: number };
    /** Derived from the largest inputs; goes as low as the lowest large input's score. */
    bigInputMinimum: { standard: number; sanctioned: number };
    /** The weighted average over all the inputs. */
    weightedAverage: { standard: number; sanctioned: number };
}

/**
 * Port of `WalletWasabi/Blockchain/Analysis/BlockchainAnalyzer.cs`.
 *
 * Sets anonymity sets for related HD public keys, by mutating them. `AnalyzeClusters` and
 * the label machinery are not ported: they never reach the `get-anonymity-scores`
 * response.
 */
export const analyze = (tx: AnalysisTransaction) => {
    const ownInputCount = tx.walletInputs.length;
    const { foreignInputCount } = tx;
    const foreignOutputCount = tx.foreignOutputs.length;

    if (ownInputCount === 0) {
        analyzeReceive(tx);

        return;
    }
    if (foreignInputCount === 0 && foreignOutputCount > 0) {
        analyzeNormalSpend(tx);

        return;
    }

    let startingOutputAnonset: number;
    if (foreignInputCount === 0) {
        startingOutputAnonset = analyzeSelfSpendWalletInputs(tx);
        analyzeSelfSpendWalletOutputs(tx, startingOutputAnonset);
    } else {
        const startingAnonScores = analyzeCoinjoinWalletInputs(tx);
        analyzeCoinjoinWalletOutputs(tx, startingAnonScores);
        startingOutputAnonset = startingAnonScores.weightedAverage.standard;
    }

    adjustWalletInputs(tx, startingOutputAnonset);
};

/** `AnalyzeCoinjoinWalletInputs`. */
const analyzeCoinjoinWalletInputs = (tx: AnalysisTransaction): StartingAnonScores => {
    const cjAnal = new CoinjoinAnalyzer(tx);

    // Consolidation in coinjoins is the only type of consolidation that's acceptable,
    // because coinjoins are an exception from the common input ownership heuristic.
    // However this is not always true: for the cases where it is, the weighted average is
    // what counts; for the cases where it isn't, the rest.
    const [mixedAnonScore, mixedAnonScoreSanctioned] = calculateWeightedAverage(tx, cjAnal);
    const [nonMixedAnonScore, nonMixedAnonScoreSanctioned] = calculateMinAnonScore(tx, cjAnal);
    const [halfMixedAnonScore, halfMixedAnonScoreSanctioned] = calculateHalfMixedAnonScore(
        tx,
        cjAnal,
        mixedAnonScore,
        mixedAnonScoreSanctioned,
    );

    return {
        minimum: { standard: nonMixedAnonScore, sanctioned: nonMixedAnonScoreSanctioned },
        bigInputMinimum: {
            standard: halfMixedAnonScore,
            sanctioned: halfMixedAnonScoreSanctioned,
        },
        weightedAverage: { standard: mixedAnonScore, sanctioned: mixedAnonScoreSanctioned },
    };
};

const amountsWithAnonymity = (
    virtualInputs: readonly WalletVirtualCoin[],
    anonymity: (input: WalletVirtualCoin) => number,
): AmountWithAnonymity[] =>
    virtualInputs.map(input => ({ anonymity: anonymity(input), amount: input.amount }));

/** `CalculateWeightedAverage`. */
const calculateWeightedAverage = (
    tx: AnalysisTransaction,
    cjAnal: CoinjoinAnalyzer,
): [number, number] => [
    weightedMean(amountsWithAnonymity(tx.walletVirtualInputs, x => x.pubKey.anonymitySet)),
    weightedMean(
        amountsWithAnonymity(
            tx.walletVirtualInputs,
            x => x.pubKey.anonymitySet + cjAnal.computeVirtualInputSanction(x, weightedMean),
        ),
    ),
];

/** `CalculateMinAnonScore`. */
const calculateMinAnonScore = (
    tx: AnalysisTransaction,
    cjAnal: CoinjoinAnalyzer,
): [number, number] => [
    min(amountsWithAnonymity(tx.walletVirtualInputs, x => x.pubKey.anonymitySet)),
    min(
        amountsWithAnonymity(
            tx.walletVirtualInputs,
            x => x.pubKey.anonymitySet + cjAnal.computeVirtualInputSanction(x, min),
        ),
    ),
];

/**
 * `CalculateHalfMixedAnonScore`.
 *
 * Punishes the smallest-anonscore input among the largest inputs; upstream relies on WW2
 * coinjoins ordering inputs by amount, and walks the input list until it hits one that
 * is not ours. `GetAnonymityScoresHelper` builds its synthetic transaction with the
 * wallet's inputs first, so in this code path the walk covers all of them.
 */
const calculateHalfMixedAnonScore = (
    tx: AnalysisTransaction,
    cjAnal: CoinjoinAnalyzer,
    mixedAnonScore: number,
    mixedAnonScoreSanctioned: number,
): [number, number] => {
    const ourLargePubKeys = new Set<AnalysisPubKey>();
    for (const input of tx.inputs) {
        if (input.coin === undefined) {
            // Don't look more.
            break;
        }
        ourLargePubKeys.add(input.coin.pubKey);
    }

    const large = tx.walletVirtualInputs.filter(x => ourLargePubKeys.has(x.pubKey));
    let halfMixedAnonScore = min(amountsWithAnonymity(large, x => x.pubKey.anonymitySet));
    let halfMixedAnonScoreSanctioned = min(
        amountsWithAnonymity(
            large,
            x => x.pubKey.anonymitySet + cjAnal.computeVirtualInputSanction(x, min),
        ),
    );

    // Sanity check: make sure to not give more than the weighted average would.
    halfMixedAnonScore = Math.min(halfMixedAnonScore, mixedAnonScore);
    halfMixedAnonScoreSanctioned = Math.min(halfMixedAnonScoreSanctioned, mixedAnonScoreSanctioned);

    return [halfMixedAnonScore, halfMixedAnonScoreSanctioned];
};

/** `AnalyzeSelfSpendWalletInputs`. */
const analyzeSelfSpendWalletInputs = (tx: AnalysisTransaction): number => {
    const distinctWalletInputPubKeys = tx.walletVirtualInputs.map(x => x.pubKey);
    const startingOutputAnonset = intersect(distinctWalletInputPubKeys.map(x => x.anonymitySet));
    distinctWalletInputPubKeys.forEach(key => key.setAnonymitySet(startingOutputAnonset));

    return startingOutputAnonset;
};

/**
 * `BlockchainAnalyzer.Intersect`.
 *
 * Estimates the input cluster anonymity set size, penalising input consolidations to
 * account for intersection attacks.
 */
const intersect = (anonsets: readonly number[]): number => {
    // Sanity check.
    if (anonsets.length === 0) {
        return 1;
    }

    // Our smallest anonset is the relevant one here, because anonsets cannot grow by
    // intersection punishments.
    const smallestAnon = Math.min(...anonsets);

    // Punish intersection exponentially. With a single anonset the exponent is zero, so
    // the division is by one and the input coin's anonset is retained.
    const intersectPenalty = 2 ** (anonsets.length - 1);
    const intersectionAnonset = smallestAnon / Math.max(1, intersectPenalty);

    // The minimum anonymity set size is 1; enforce it when the punishment is very large.
    return Math.max(1, intersectionAnonset);
};

/** `AnalyzeCoinjoinWalletOutputs`. */
const analyzeCoinjoinWalletOutputs = (
    tx: AnalysisTransaction,
    startingAnonScores: StartingAnonScores,
) => {
    const { foreignInputCount } = tx;
    let maxAmountWeightedAverageIsApplicableFor: number | undefined;

    tx.walletVirtualOutputs.forEach(virtualOutput => {
        let startingOutputAnonset: { standard: number; sanctioned: number };

        // If the virtual output has a nonempty anonymity set.
        if (!tx.foreignVirtualOutputs.some(x => x.amount === virtualOutput.amount)) {
            // When a WW2 denom output isn't too large, then it's not change.
            if (tx.isWasabi2Cj && isStdDenom(virtualOutput.amount)) {
                if (maxAmountWeightedAverageIsApplicableFor === undefined) {
                    maxAmountWeightedAverageIsApplicableFor =
                        tryGetLargestEqualForeignOutputAmount(tx) ?? MAXIMUM_NUMBER_OF_SATOSHIS;
                }

                startingOutputAnonset =
                    virtualOutput.amount <= maxAmountWeightedAverageIsApplicableFor
                        ? startingAnonScores.weightedAverage
                        : startingAnonScores.bigInputMinimum;
            } else {
                startingOutputAnonset = startingAnonScores.minimum;
            }
        } else {
            startingOutputAnonset = startingAnonScores.weightedAverage;
        }

        // Anonset gain cannot be larger than others' input count: picking an output
        // randomly would make our anonset total/ours.
        const anonymityGain = Math.min(
            computeAnonymityContribution(virtualOutput.coins[0]!),
            foreignInputCount,
        );

        // Account for the inherited anonymity set size from the inputs in the estimate.
        const anonset = Math.max(
            startingOutputAnonset.sanctioned + anonymityGain,
            anonymityGain + 1,
            startingOutputAnonset.standard,
        );

        const pubKeys = [...new Set(virtualOutput.coins.map(x => x.pubKey))];
        pubKeys.forEach(pubKey => {
            const txid = tx.id;
            if (pubKey.anonymitySet === DEFAULT_HIGH_ANONYMITY_SET) {
                // If the new coin's HD pubkey hasn't been used yet then its anonset hasn't
                // been set yet, so the acquired anonset does not have to be intersected
                // with the default one.
                pubKey.setAnonymitySet(anonset, txid);
            } else if (tx.walletVirtualInputs.some(x => x.pubKey === pubKey)) {
                // If it's a reuse of an input's pubkey, then intersection punishment is
                // senseless.
                pubKey.setAnonymitySet(startingOutputAnonset.sanctioned, txid);
            } else if (pubKey.outputAnonSetReasons.has(txid)) {
                // We already processed this transaction for this script, so go with normal
                // processing. It may be a duplicated processing or new information arriving
                // (like another wallet loaded). If there are more anonsets already then
                // it's address reuse that has already been punished, so leave it alone.
                if (pubKey.outputAnonSetReasons.size === 1) {
                    pubKey.setAnonymitySet(anonset, txid);
                }
            } else {
                // It's address reuse.
                pubKey.setAnonymitySet(intersect([anonset, pubKey.anonymitySet]), txid);
            }
        });
    });
};

/**
 * `TryGetLargestEqualForeignOutputAmount`.
 *
 * Despite the name, it is the *first* foreign virtual output amount (in grouping order)
 * that occurs more than once, and a `default` result — zero — reads as "not found".
 */
const tryGetLargestEqualForeignOutputAmount = (tx: AnalysisTransaction): number | undefined => {
    const counts = new Map<number, number>();
    tx.foreignVirtualOutputs.forEach(output => {
        counts.set(output.amount, (counts.get(output.amount) ?? 0) + 1);
    });
    const found = [...counts.entries()].find(([, count]) => count > 1)?.[0] ?? 0;

    return found === 0 ? undefined : found;
};

/** `AdjustWalletInputs` — adjusts the inputs' anonset down to the new output anonsets. */
const adjustWalletInputs = (tx: AnalysisTransaction, startingOutputAnonset: number) => {
    // Sanity check.
    if (tx.walletOutputs.length === 0) {
        return;
    }

    const smallestOutputAnonset = Math.min(...tx.walletOutputs.map(x => x.pubKey.anonymitySet));
    if (smallestOutputAnonset < startingOutputAnonset) {
        tx.walletVirtualInputs.forEach(x => x.pubKey.setAnonymitySet(smallestOutputAnonset));
    }
};

/** `AnalyzeSelfSpendWalletOutputs`. */
const analyzeSelfSpendWalletOutputs = (tx: AnalysisTransaction, startingOutputAnonset: number) => {
    tx.walletOutputs.forEach(({ pubKey }) => {
        if (pubKey.anonymitySet === DEFAULT_HIGH_ANONYMITY_SET) {
            pubKey.setAnonymitySet(startingOutputAnonset, tx.id);
        } else {
            pubKey.setAnonymitySet(intersect([startingOutputAnonset, pubKey.anonymitySet]), tx.id);
        }
    });
};

/**
 * `AnalyzeReceive`.
 *
 * No matter how much anonymity a user would have gained in a transaction, if the money
 * comes from outside then the anonset is 1.
 */
const analyzeReceive = (tx: AnalysisTransaction) => {
    tx.walletOutputs.forEach(({ pubKey }) => pubKey.setAnonymitySet(1, tx.id));
};

/**
 * `AnalyzeNormalSpend`.
 *
 * If all our inputs are ours and there's more than one output that isn't, then assume the
 * money was sent to learn our inputs, and that the change outputs were learnt too.
 */
const analyzeNormalSpend = (tx: AnalysisTransaction) => {
    tx.walletInputs.forEach(({ pubKey }) => pubKey.setAnonymitySet(1));
    tx.walletOutputs.forEach(({ pubKey }) => pubKey.setAnonymitySet(1, tx.id));
};

export { intersect, type AggregationFunction };

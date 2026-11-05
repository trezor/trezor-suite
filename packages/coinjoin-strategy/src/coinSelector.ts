import { type Random } from '@trezor/wabisabi-crypto';

import { type CoinJoinCoinSelectorRandomnessGenerator } from './coinSelectorRandomnessGenerator';
import { createDenominations, orderBy, orderByDescending } from './denominationBuilder';
import {
    biasedRandomElement,
    combinationsWithoutRepetition,
    generalizedWeightedMean,
    randomElement,
    toShuffled,
} from './extensions';
import {
    type CoordinationFeeRate,
    type FeeRate,
    MAXIMUM_NUMBER_OF_BITCOINS_MONEY,
    type MoneyRange,
    type ScriptType,
    effectiveValue,
    moneyRangeContains,
} from './money';

const sum = (values: readonly number[]) => values.reduce((total, value) => total + value, 0);

/**
 * LINQ's `Except` — set difference by reference identity for these coin objects, which
 * also means the result is distinct. Coins are compared by identity here because every
 * coin in a selection is a distinct object; upstream compares `SmartCoin` by value, and
 * two distinct UTXOs never compare equal.
 */
const except = <T>(source: readonly T[], excluded: readonly T[]): T[] => {
    const toRemove = new Set(excluded);
    const seen = new Set<T>();

    return source.filter(item => {
        if (toRemove.has(item) || seen.has(item)) {
            return false;
        }
        seen.add(item);

        return true;
    });
};

/** `CoinJoinCoinSelector.TryAddGroup`. */
const tryAddGroup = <TCoin extends SmartCoin>(
    parameters: UtxoSelectionParameters,
    groups: TCoin[][],
    group: TCoin[],
) => {
    const effectiveInputSum = sum(
        group.map(x =>
            effectiveValue(
                x.amount,
                x.scriptType as ScriptType,
                parameters.miningFeeRate,
                parameters.coordinationFeeRate,
            ),
        ),
    );
    if (effectiveInputSum >= parameters.allowedOutputAmounts.Min) {
        groups.push(group);

        return true;
    }

    return false;
};

/**
 * `CoinJoinCoinSelector.GetAnonLoss`.
 *
 * The parameters were picked experimentally to model anonymity loss that matches
 * real-world experience: https://github.com/zkSNACKs/WalletWasabi/pull/10096
 */
const getAnonLoss = <TCoin extends SmartCoin>(coins: readonly TCoin[]) => {
    if (coins.length <= 1) {
        return 0;
    }

    const p = 10;
    const q = 0.8;
    const minimumAnonScore = Math.min(...coins.map(x => x.anonymitySet));

    return generalizedWeightedMean(
        coins,
        x => x.anonymitySet - minimumAnonScore,
        x => x.amount ** q,
        p,
    );
};

/** `CoinJoinCoinSelector.GetReps`. */
const getReps = <TCoin extends SmartCoin>(group: readonly TCoin[]) => {
    const byTx = new Map<string, number>();
    group.forEach(coin => {
        byTx.set(coin.transactionId, (byTx.get(coin.transactionId) ?? 0) + 1);
    });

    return [...byTx.values()].reduce((total, count) => total + (count - 1), 0);
};

/** `OrderBy(...).ThenByDescending(...)` as one stable sort over a key tuple. */
const orderByKeys = <T>(source: readonly T[], keys: (item: T) => number[]): T[] => {
    const decorated = source.map((item, index) => ({ item, index, keys: keys(item) }));
    decorated.sort((a, b) => {
        for (let i = 0; i < a.keys.length; i++) {
            const left = a.keys[i] as number;
            const right = b.keys[i] as number;
            if (left !== right) {
                return left < right ? -1 : 1;
            }
        }

        return a.index - b.index;
    });

    return decorated.map(x => x.item);
};

/** `CoinJoinCoinSelector.MaxInputsRegistrableByWallet`. */
export const MAX_INPUTS_REGISTRABLE_BY_WALLET = 20;

/** `CoinJoinCoinSelector.MaxWeightedAnonLoss` — maximum tolerable weighted anon loss. */
export const MAX_WEIGHTED_ANON_LOSS = 3;

/** `WalletWasabi.Blockchain.TransactionOutputs.ISmartCoin`. */
export interface SmartCoin {
    amount: number;
    scriptType: ScriptType | undefined;
    scriptPubKey: string;
    anonymitySet: number;
    transactionId: string;
    index: number;
}

/** `WalletWasabi/WabiSabi/Backend/Rounds/UtxoSelectionParameters.cs`. */
export interface UtxoSelectionParameters {
    allowedInputAmounts: MoneyRange;
    allowedOutputAmounts: MoneyRange;
    coordinationFeeRate: CoordinationFeeRate;
    miningFeeRate: FeeRate;
    allowedInputScriptTypes: readonly ScriptType[];
}

/**
 * `RoundParameters.CalculateSmallestReasonableEffectiveDenomination` — the static
 * overload the client library calls.
 *
 * Returns the smallest effective denomination larger than the min reasonable output
 * amount. Consumes randomness, because building the denominations draws a script type
 * per candidate.
 */
export const calculateSmallestReasonableEffectiveDenomination = (
    minReasonableOutputAmount: number,
    maxAllowedOutputAmount: number,
    feeRate: FeeRate,
    maxVsizeInputOutputPairScriptType: ScriptType,
    random: Random,
): number => {
    const denominations = createDenominations(
        minReasonableOutputAmount,
        maxAllowedOutputAmount,
        feeRate,
        [maxVsizeInputOutputPairScriptType],
        random,
    );
    if (denominations.length === 0) {
        throw new Error(
            "Something's wrong with the denomination creation or with the parameters it got.",
        );
    }

    return Math.min(...denominations.map(x => x.effectiveCost));
};

/** `CoinHelpers.IsPrivate`. */
export const isPrivate = (coin: SmartCoin, privateThreshold: number) =>
    coin.anonymitySet >= privateThreshold;

/** `CoinHelpers.IsSemiPrivate`. */
export const isSemiPrivate = (
    coin: SmartCoin,
    privateThreshold: number,
    semiPrivateThreshold: number,
) => coin.anonymitySet >= semiPrivateThreshold && coin.anonymitySet < privateThreshold;

/** `CoinHelpers.IsRedCoin`. */
export const isRedCoin = (coin: SmartCoin, semiPrivateThreshold: number) =>
    coin.anonymitySet < semiPrivateThreshold;

/**
 * Port of `WalletWasabi/WabiSabi/Client/CoinJoinCoinSelector.cs`.
 *
 * Selection is policy, and divergence is silent: nothing crashes, Suite's registered
 * inputs simply become distinguishable inside a shared round. Every draw goes through
 * the extensions in `extensions.ts` in upstream's order.
 */
export class CoinJoinCoinSelector {
    readonly consolidationMode: boolean;
    readonly anonScoreTarget: number;
    readonly semiPrivateThreshold: number;

    private readonly generator: CoinJoinCoinSelectorRandomnessGenerator;

    constructor(
        consolidationMode: boolean,
        anonScoreTarget: number,
        semiPrivateThreshold: number,
        generator: CoinJoinCoinSelectorRandomnessGenerator,
    ) {
        this.consolidationMode = consolidationMode;
        this.anonScoreTarget = anonScoreTarget;
        this.semiPrivateThreshold = semiPrivateThreshold;
        this.generator = generator;
    }

    private get rnd() {
        return this.generator.rnd;
    }

    /** `liquidityClue` — weakly prefer not to select inputs over this. */
    selectCoinsForRound<TCoin extends SmartCoin>(
        coins: readonly TCoin[],
        parameters: UtxoSelectionParameters,
        liquidityClue: number,
    ): TCoin[] {
        const clue = liquidityClue > 0 ? liquidityClue : MAXIMUM_NUMBER_OF_BITCOINS_MONEY;

        const filteredCoins = coins
            .filter(x => moneyRangeContains(parameters.allowedInputAmounts, x.amount))
            .filter(
                x =>
                    x.scriptType !== undefined &&
                    parameters.allowedInputScriptTypes.includes(x.scriptType),
            )
            .filter(
                x =>
                    effectiveValue(x.amount, x.scriptType as ScriptType, parameters.miningFeeRate) >
                    0,
            );

        // Sanity check.
        if (filteredCoins.length === 0) {
            return [];
        }

        const privateCoins = filteredCoins.filter(x => isPrivate(x, this.anonScoreTarget));
        const semiPrivateCoins = filteredCoins.filter(x =>
            isSemiPrivate(x, this.anonScoreTarget, this.semiPrivateThreshold),
        );
        // redCoins will only fill up if red coin isolation is turned on. Otherwise the
        // coin will be in semiPrivateCoins.
        const redCoins = filteredCoins.filter(x => isRedCoin(x, this.semiPrivateThreshold));

        if (semiPrivateCoins.length + redCoins.length === 0) {
            return [];
        }

        // We want to isolate red coins from each other. We only let a single red coin get
        // into our selection candidates.
        const allowedNonPrivateCoins = [...semiPrivateCoins];
        const red = randomElement(redCoins, this.rnd);
        if (red !== undefined) {
            allowedNonPrivateCoins.push(red);
        }

        const inputCount = Math.min(
            privateCoins.length + allowedNonPrivateCoins.length,
            this.consolidationMode
                ? MAX_INPUTS_REGISTRABLE_BY_WALLET
                : this.generator.getInputTarget(),
        );

        const biasShuffledPrivateCoins = this.anonScoreTxSourceBiasedShuffle(privateCoins);

        // Deprioritize private coins that are too large.
        const smallerPrivateCoins = biasShuffledPrivateCoins.filter(x => x.amount <= clue);
        const largerPrivateCoins = biasShuffledPrivateCoins.filter(x => x.amount > clue);

        // Let's allow only inputCount - 1 private coins to play.
        const allowedPrivateCoins = [...smallerPrivateCoins, ...largerPrivateCoins].slice(
            0,
            Math.max(inputCount - 1, 0),
        );

        const allowedCoins = [...allowedNonPrivateCoins, ...allowedPrivateCoins];

        // Shuffle coins, while randomly biasing towards lower anonymity score.
        const orderedAllowedCoins = this.anonScoreTxSourceBiasedShuffle(allowedCoins);

        // Always use the largest amounts, so we do not participate with insignificant
        // amounts and fragment the wallet needlessly.
        const largestNonPrivateCoins = orderByDescending(
            allowedNonPrivateCoins,
            x => x.amount,
        ).slice(0, 3);

        // Select a group of coins that are close to each other by anonymity score.
        //
        // Upstream keeps these in a `Dictionary<int, IEnumerable<TCoin>>` keyed by
        // `HashCode.Combine(group.OrderBy(...))`. That single argument is an
        // `IOrderedEnumerable`, so the hash is the *object identity* of a freshly created
        // iterator and is therefore different on every call: the dictionary never
        // de-duplicates anything and is in effect an insertion-ordered list. This is that
        // list.
        const groups: TCoin[][] = [];

        const start1 = Date.now();
        for (const coin of largestNonPrivateCoins) {
            // Create a base combination just in case.
            const baseGroup = [
                ...except(orderedAllowedCoins, [coin]).slice(0, Math.max(inputCount - 1, 0)),
                coin,
            ];
            tryAddGroup(parameters, groups, baseGroup);

            const start2 = Date.now();
            const rest = except(orderedAllowedCoins, [coin]);
            for (const combination of combinationsWithoutRepetition(
                rest,
                Math.max(inputCount - 1, 0),
            )) {
                tryAddGroup(parameters, groups, [...combination, coin]);

                // Upstream bounds the combinatorial explosion with a wall clock, which
                // means the set of candidates depends on how fast the machine is. Kept as
                // it is: the alternative would be a different candidate set from the
                // reference implementation's on every machine either way.
                if (Date.now() - start2 > 1_000) {
                    break;
                }
            }

            if (Date.now() - start1 > 10_000) {
                break;
            }
        }

        if (groups.length === 0) {
            return [];
        }

        // Select the group where the fewest coins come from the same tx.
        const bestRep = Math.min(...groups.map(getReps));
        const bestRepGroups = groups.filter(x => getReps(x) === bestRep);

        const remainingLargestNonPrivateCoins = largestNonPrivateCoins.filter(x =>
            bestRepGroups.some(y => y.includes(x)),
        );

        // Bias selection towards larger numbers. Select randomly at first just to have a
        // starting value.
        let selectedNonPrivateCoin = randomElement(remainingLargestNonPrivateCoins, this.rnd);
        for (const coin of orderByDescending(remainingLargestNonPrivateCoins, x => x.amount)) {
            if (this.rnd.getInt(1, 101) <= 50) {
                selectedNonPrivateCoin = coin;
                break;
            }
        }
        if (selectedNonPrivateCoin === undefined) {
            return [];
        }

        const finalCandidate = randomElement(
            bestRepGroups.filter(x => x.includes(selectedNonPrivateCoin as TCoin)),
            this.rnd,
        );
        if (finalCandidate === undefined) {
            return [];
        }

        // Let's remove some coins coming from the same tx in the final candidate: the
        // smaller our balance is the more privacy we gain and the more the user cares
        // about the costs, so more interconnectedness allowance makes sense.
        const toRegister = sum(finalCandidate.map(x => x.amount));
        let percent: number;
        if (toRegister < 10_000) {
            percent = 20;
        } else if (toRegister < 100_000) {
            percent = 30;
        } else if (toRegister < 1_000_000) {
            percent = 40;
        } else if (toRegister < 10_000_000) {
            percent = 50;
        } else if (toRegister < 100_000_000) {
            // 1 BTC
            percent = 60;
        } else if (toRegister < 1_000_000_000) {
            percent = 70;
        } else {
            percent = 80;
        }

        const sameTxAllowance = this.generator.getRandomBiasedSameTxAllowance(percent);

        let winner: TCoin[] = [selectedNonPrivateCoin];

        for (const coin of orderByKeys(except(finalCandidate, [selectedNonPrivateCoin]), x => [
            x.anonymitySet,
            -x.amount,
        ])) {
            // If the coin is coming from the same tx, then check our allowance.
            if (winner.some(x => x.transactionId === coin.transactionId)) {
                const sameTxUsed = winner.length - new Set(winner.map(x => x.transactionId)).size;
                if (sameTxUsed < sameTxAllowance) {
                    winner.push(coin);
                }
            } else {
                winner.push(coin);
            }
        }

        let winnerAnonLoss = getAnonLoss(winner);

        // Only stay in the loop if we are above the liquidityClue (we are a whale) AND the
        // weighted anon loss is not tolerable.
        while (sum(winner.map(x => x.amount)) > clue && winnerAnonLoss > MAX_WEIGHTED_ANON_LOSS) {
            let bestReducedWinner = winner;
            let bestAnonLoss = winnerAnonLoss;
            let winnerChanged = false;

            // We always want to keep the non-private coins.
            for (const coin of except(winner, [selectedNonPrivateCoin])) {
                const reducedWinner = except(winner, [coin]);
                const anonLoss = getAnonLoss(reducedWinner);

                if (anonLoss <= bestAnonLoss) {
                    bestAnonLoss = anonLoss;
                    bestReducedWinner = reducedWinner;
                    winnerChanged = true;
                }
            }

            if (!winnerChanged) {
                break;
            }

            winner = bestReducedWinner;
            winnerAnonLoss = bestAnonLoss;
        }

        if (winner.length < MAX_INPUTS_REGISTRABLE_BY_WALLET) {
            // If the address of a winner contains other coins (address reuse, same
            // HdPubKey) that are available but not selected, complete the selection with
            // them until the MaxInputsRegistrableByWallet threshold. Order by most to
            // least reused to try not splitting coins from the same address into several
            // rounds.
            const candidates = except(filteredCoins, winner).filter(x =>
                winner.some(y => y.scriptPubKey === x.scriptPubKey),
            );
            const byScript = new Map<string, TCoin[]>();
            candidates.forEach(coin => {
                const group = byScript.get(coin.scriptPubKey);
                if (group === undefined) {
                    byScript.set(coin.scriptPubKey, [coin]);
                } else {
                    group.push(coin);
                }
            });
            const nonSelectedCoinsOnSameAddresses = orderByDescending(
                [...byScript.values()],
                group => group.length,
            )
                .flat()
                .slice(0, MAX_INPUTS_REGISTRABLE_BY_WALLET - winner.length);

            winner.push(...nonSelectedCoinsOnSameAddresses);
        }

        return toShuffled(winner, this.rnd);
    }

    private anonScoreTxSourceBiasedShuffle<TCoin extends SmartCoin>(coins: readonly TCoin[]) {
        const orderedCoins: TCoin[] = [];
        for (let i = 0; i < coins.length; i++) {
            // Order by anon score first.
            const remaining = orderBy(except(coins, orderedCoins), x => x.anonymitySet);

            // Then manipulate the list so repeating tx sources go to the end.
            const alternating: TCoin[] = [];
            const skipped: TCoin[] = [];
            for (const c of remaining) {
                if (
                    alternating.some(x => x.transactionId === c.transactionId) ||
                    orderedCoins.some(x => x.transactionId === c.transactionId)
                ) {
                    skipped.push(c);
                } else {
                    alternating.push(c);
                }
            }
            alternating.push(...skipped);

            orderedCoins.push(biasedRandomElement(alternating, 50, this.rnd) as TCoin);
        }

        return orderedCoins;
    }
}

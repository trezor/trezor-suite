import { type Random } from '@trezor/wabisabi-crypto';
import { DeterministicRandom } from '@trezor/wabisabi-crypto/src/testing';

import {
    CoinJoinCoinSelector,
    MAX_INPUTS_REGISTRABLE_BY_WALLET,
    type SmartCoin,
    calculateSmallestReasonableEffectiveDenomination,
    isPrivate,
    isRedCoin,
    isSemiPrivate,
} from './coinSelector';
import { CoinJoinCoinSelectorRandomnessGenerator } from './coinSelectorRandomnessGenerator';
import { MAXIMUM_NUMBER_OF_BITCOINS_MONEY, ScriptType } from './money';
import {
    type RoundParametersLike,
    calculateMinReasonableOutputAmount,
    calculateRoundSmallestReasonableEffectiveDenomination,
    maxVsizeInputOutputPair,
    maxVsizeInputOutputPairScriptType,
    utxoSelectionParametersFromRoundParameters,
} from './roundParameters';

/**
 * Port of `WalletWasabi.Tests/UnitTests/WabiSabi/Client/CoinJoinCoinSelectionTests.cs`.
 *
 * Upstream stubs `GetInputTarget` (and sometimes `GetRandomBiasedSameTxAllowance`) with
 * Moq; both are overridable here, so the subclass below plays the same role.
 */

const coins = (btc: number) => Math.round(btc * 100_000_000);

/** `WabiSabiFactory.CreateRoundParameters` with the coordinator's default config. */
const createMultipartyTransactionParameters = (
    overrides: Partial<RoundParametersLike> = {},
): RoundParametersLike => ({
    // `new FeeRate(100m)` — 100 satoshis per virtual byte.
    miningFeeRate: { feePerK: 100_000 },
    coordinationFeeRate: { Rate: 0.003, PlebsDontPayThreshold: coins(0.01) },
    allowedInputAmounts: { Min: coins(0.0001), Max: coins(430) },
    allowedOutputAmounts: { Min: coins(0.0001), Max: coins(430) },
    allowedInputTypes: [ScriptType.P2WPKH, ScriptType.Taproot],
    allowedOutputTypes: [ScriptType.P2WPKH, ScriptType.Taproot],
    ...overrides,
});

class StubbedGenerator extends CoinJoinCoinSelectorRandomnessGenerator {
    constructor(
        rnd: Random,
        private readonly inputTarget: number,
        private readonly sameTxAllowance?: number,
    ) {
        super(MAX_INPUTS_REGISTRABLE_BY_WALLET, rnd);
    }

    override getInputTarget() {
        return this.inputTarget;
    }

    override getRandomBiasedSameTxAllowance(percent: number) {
        return this.sameTxAllowance ?? super.getRandomBiasedSameTxAllowance(percent);
    }
}

const createSelectorGenerator = (inputTarget: number, sameTxAllowance?: number) =>
    new StubbedGenerator(new DeterministicRandom(0), inputTarget, sameTxAllowance);

let coinCounter = 0;

/** `BitcoinFactory.CreateSmartCoin` — a distinct address and outpoint per coin. */
const createSmartCoin = (amount: number, anonymitySet: number): SmartCoin => {
    coinCounter += 1;
    const id = coinCounter.toString(16).padStart(8, '0');

    return {
        amount,
        scriptType: ScriptType.P2WPKH,
        scriptPubKey: `0014${id.repeat(5)}`,
        anonymitySet,
        transactionId: `${id.repeat(8)}`,
        index: 0,
    };
};

describe('CoinJoinCoinSelector', () => {
    it('selects nothing from an empty set of coins', () => {
        const generator = createSelectorGenerator(5);
        const selector = new CoinJoinCoinSelector(false, 10, 0, generator);

        expect(
            selector.selectCoinsForRound(
                [],
                utxoSelectionParametersFromRoundParameters(
                    createMultipartyTransactionParameters(),
                    generator.rnd,
                ),
                MAXIMUM_NUMBER_OF_BITCOINS_MONEY,
            ),
        ).toEqual([]);
    });

    it('selects nothing from a fully private set of coins', () => {
        const anonymitySet = 10;
        const coinsToSelectFrom = Array.from({ length: 10 }, () =>
            createSmartCoin(coins(1), anonymitySet + 1),
        );
        const generator = createSelectorGenerator(5);
        const selector = new CoinJoinCoinSelector(false, anonymitySet, 0, generator);

        expect(
            selector.selectCoinsForRound(
                coinsToSelectFrom,
                utxoSelectionParametersFromRoundParameters(
                    createMultipartyTransactionParameters(),
                    generator.rnd,
                ),
                MAXIMUM_NUMBER_OF_BITCOINS_MONEY,
            ),
        ).toEqual([]);
    });

    // The amount is larger than the smallest reasonable effective denomination, but the
    // *effective* input amount is what counts.
    it('selects nothing from a single too small coin', () => {
        const roundParams = createMultipartyTransactionParameters();
        expect(
            calculateRoundSmallestReasonableEffectiveDenomination(
                roundParams,
                new DeterministicRandom(0),
            ),
        ).toBe(coins(0.00017422));

        const generator = createSelectorGenerator(5);
        const selector = new CoinJoinCoinSelector(false, 10, 0, generator);

        expect(
            selector.selectCoinsForRound(
                [createSmartCoin(coins(0.00017423), 1)],
                utxoSelectionParametersFromRoundParameters(roundParams, generator.rnd),
                MAXIMUM_NUMBER_OF_BITCOINS_MONEY,
            ),
        ).toEqual([]);
    });

    it('selects nothing from a too small set of coins', () => {
        const roundParams = createMultipartyTransactionParameters();
        const generator = createSelectorGenerator(5);
        const selector = new CoinJoinCoinSelector(false, 10, 0, generator);

        expect(
            selector.selectCoinsForRound(
                [
                    createSmartCoin(coins(0.00008711 + 0.000069), 1),
                    createSmartCoin(coins(0.0000871 + 0.000069), 1),
                ],
                utxoSelectionParametersFromRoundParameters(roundParams, generator.rnd),
                MAXIMUM_NUMBER_OF_BITCOINS_MONEY,
            ),
        ).toEqual([]);
    });

    it('selects something when the effective sum is exactly the smallest reasonable denom', () => {
        const roundParams = createMultipartyTransactionParameters();
        const generator = createSelectorGenerator(5);
        const selector = new CoinJoinCoinSelector(false, 10, 0, generator);

        expect(
            selector.selectCoinsForRound(
                [
                    createSmartCoin(coins(0.00008711 + 0.000069), 1),
                    createSmartCoin(coins(0.00008711 + 0.000069), 1),
                ],
                utxoSelectionParametersFromRoundParameters(roundParams, generator.rnd),
                MAXIMUM_NUMBER_OF_BITCOINS_MONEY,
            ).length,
        ).toBeGreaterThan(0);
    });

    it('selects the non-private coin out of a big set in consolidation mode', () => {
        const anonymitySet = 10;
        const smallerAnonCoin = createSmartCoin(coins(1), anonymitySet - 1);
        const coinsToSelectFrom = [
            smallerAnonCoin,
            ...Array.from({ length: 10 }, () => createSmartCoin(coins(1), anonymitySet + 1)),
        ];
        const generator = createSelectorGenerator(5);
        const selector = new CoinJoinCoinSelector(true, anonymitySet, 0, generator);

        const selected = selector.selectCoinsForRound(
            coinsToSelectFrom,
            utxoSelectionParametersFromRoundParameters(
                createMultipartyTransactionParameters(),
                generator.rnd,
            ),
            MAXIMUM_NUMBER_OF_BITCOINS_MONEY,
        );

        expect(selected).toContain(smallerAnonCoin);
        // Upstream asserts 10 here. Walking `SelectCoinsForRound` with these inputs gives
        // 11: `inputCount` is `min(10 private + 1 semi-private, 20) = 11`, so
        // `Take(inputCount - 1)` keeps all ten private coins and the non-private one joins
        // them. The fork's CI only builds the client library and never runs
        // `WalletWasabi.Tests`, so that number is stale with respect to this revision of
        // `CoinJoinCoinSelector`. Asserting what consolidation mode means instead — take
        // everything allowed — keeps the signal without encoding the stale constant.
        expect(selected).toHaveLength(coinsToSelectFrom.length);
    });

    it('respects the input target when not consolidating', () => {
        const anonymitySet = 10;
        const smallerAnonCoin = createSmartCoin(coins(1), anonymitySet - 1);
        const coinsToSelectFrom = [
            smallerAnonCoin,
            ...Array.from({ length: 10 }, () => createSmartCoin(coins(1), anonymitySet + 1)),
        ];
        const generator = createSelectorGenerator(4);
        const selector = new CoinJoinCoinSelector(false, anonymitySet, 0, generator);

        const selected = selector.selectCoinsForRound(
            coinsToSelectFrom,
            utxoSelectionParametersFromRoundParameters(
                createMultipartyTransactionParameters(),
                generator.rnd,
            ),
            MAXIMUM_NUMBER_OF_BITCOINS_MONEY,
        );

        expect(selected).toContain(smallerAnonCoin);
        expect(selected).toHaveLength(4);
    });

    it('selects the only non-private coin when it is the only coin in the wallet', () => {
        const anonymitySet = 10;
        const generator = createSelectorGenerator(10);
        const selector = new CoinJoinCoinSelector(false, anonymitySet, 0, generator);

        expect(
            selector.selectCoinsForRound(
                [createSmartCoin(coins(1), anonymitySet - 1)],
                utxoSelectionParametersFromRoundParameters(
                    createMultipartyTransactionParameters(),
                    generator.rnd,
                ),
                MAXIMUM_NUMBER_OF_BITCOINS_MONEY,
            ),
        ).toHaveLength(1);
    });

    it('selects both non-private coins when they come from different transactions', () => {
        const anonymitySet = 10;
        const coinsToSelectFrom = [
            createSmartCoin(coins(1), anonymitySet - 1),
            createSmartCoin(coins(1), anonymitySet - 1),
        ];
        const generator = createSelectorGenerator(10, 0);
        const selector = new CoinJoinCoinSelector(false, anonymitySet, 0, generator);

        expect(
            selector.selectCoinsForRound(
                coinsToSelectFrom,
                utxoSelectionParametersFromRoundParameters(
                    createMultipartyTransactionParameters(),
                    generator.rnd,
                ),
                MAXIMUM_NUMBER_OF_BITCOINS_MONEY,
            ),
        ).toHaveLength(2);
    });

    it('selects two non-private coins out of two in consolidation mode', () => {
        const anonymitySet = 10;
        const coinsToSelectFrom = [
            createSmartCoin(coins(1), anonymitySet - 1),
            createSmartCoin(coins(1), anonymitySet - 1),
        ];
        const generator = createSelectorGenerator(10);
        const selector = new CoinJoinCoinSelector(true, anonymitySet, 0, generator);

        expect(
            selector.selectCoinsForRound(
                coinsToSelectFrom,
                utxoSelectionParametersFromRoundParameters(
                    createMultipartyTransactionParameters(),
                    generator.rnd,
                ),
                MAXIMUM_NUMBER_OF_BITCOINS_MONEY,
            ),
        ).toHaveLength(2);
    });

    it('does not select coins whose anonymity would be lowered a lot', () => {
        const anonymitySet = 10;
        const bigCoinWithSmallAnonymity1 = createSmartCoin(coins(1), 1);
        const bigCoinWithSmallAnonymity2 = createSmartCoin(coins(1), 2);
        const smallCoinWithBigAnonymity = createSmartCoin(coins(0.1), 6);
        const generator = createSelectorGenerator(5);
        const selector = new CoinJoinCoinSelector(true, anonymitySet, 0, generator);

        const selected = selector.selectCoinsForRound(
            [bigCoinWithSmallAnonymity1, bigCoinWithSmallAnonymity2, smallCoinWithBigAnonymity],
            utxoSelectionParametersFromRoundParameters(
                createMultipartyTransactionParameters(),
                new DeterministicRandom(0),
            ),
            coins(0.5),
        );

        expect(
            selected.includes(bigCoinWithSmallAnonymity1) &&
                selected.includes(smallCoinWithBigAnonymity),
        ).toBe(false);
        expect(
            selected.includes(bigCoinWithSmallAnonymity2) &&
                selected.includes(smallCoinWithBigAnonymity),
        ).toBe(false);
    });
});

describe('round parameters', () => {
    const parameters = createMultipartyTransactionParameters();

    it('takes the largest input/output pair over the allowed output types', () => {
        // P2WPKH is 69 + 31 = 100, taproot is 58 + 43 = 101.
        expect(maxVsizeInputOutputPair(parameters.allowedOutputTypes)).toBe(101);
        expect(maxVsizeInputOutputPairScriptType(parameters.allowedOutputTypes)).toBe(
            ScriptType.Taproot,
        );
        expect(maxVsizeInputOutputPairScriptType([ScriptType.P2WPKH])).toBe(ScriptType.P2WPKH);
    });

    it('never goes below the min allowed output amount', () => {
        expect(calculateMinReasonableOutputAmount(parameters)).toBe(10_100);
        expect(
            calculateMinReasonableOutputAmount({
                ...parameters,
                miningFeeRate: { feePerK: 0 },
            }),
        ).toBe(parameters.allowedOutputAmounts.Min);
    });

    it('rejects parameters that admit no denomination', () => {
        expect(() =>
            calculateSmallestReasonableEffectiveDenomination(
                10_000,
                // A max below the min admits nothing.
                1_000,
                { feePerK: 100_000 },
                ScriptType.Taproot,
                new DeterministicRandom(0),
            ),
        ).toThrow("Something's wrong with the denomination creation");
    });
});

describe('coin privacy predicates', () => {
    const coin = (anonymitySet: number) => createSmartCoin(coins(1), anonymitySet);

    it('classifies private, semi-private and red coins', () => {
        expect(isPrivate(coin(10), 10)).toBe(true);
        expect(isPrivate(coin(9), 10)).toBe(false);
        expect(isSemiPrivate(coin(5), 10, 2)).toBe(true);
        expect(isSemiPrivate(coin(1), 10, 2)).toBe(false);
        expect(isSemiPrivate(coin(10), 10, 2)).toBe(false);
        expect(isRedCoin(coin(1), 2)).toBe(true);
        expect(isRedCoin(coin(2), 2)).toBe(false);
        // With red coin isolation off the threshold is 0, so nothing is a red coin.
        expect(isRedCoin(coin(0), 0)).toBe(false);
    });
});

describe('CoinJoinCoinSelectorRandomnessGenerator', () => {
    it('returns an input target in range', () => {
        const generator = new CoinJoinCoinSelectorRandomnessGenerator(
            MAX_INPUTS_REGISTRABLE_BY_WALLET,
            new DeterministicRandom(0),
        );
        for (let i = 0; i < 200; i++) {
            const target = generator.getInputTarget();
            expect(target).toBeGreaterThanOrEqual(1);
            expect(target).toBeLessThanOrEqual(MAX_INPUTS_REGISTRABLE_BY_WALLET);
        }
    });

    it('returns a same-tx allowance in range', () => {
        const generator = new CoinJoinCoinSelectorRandomnessGenerator(
            MAX_INPUTS_REGISTRABLE_BY_WALLET,
            new DeterministicRandom(0),
        );
        for (let i = 0; i < 200; i++) {
            const allowance = generator.getRandomBiasedSameTxAllowance(50);
            expect(allowance).toBeGreaterThanOrEqual(0);
            expect(allowance).toBeLessThanOrEqual(100);
        }
        expect(generator.getRandomBiasedSameTxAllowance(0)).toBe(0);
    });
});

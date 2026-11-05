import {
    AnalyzedTransactionBuilder,
    createPubKey,
    createScript,
    createSmartTransaction,
} from './__fixtures__/transactionFactory';
import { analyze } from './blockchainAnalyzer';
import { DEFAULT_HIGH_ANONYMITY_SET } from './constants';
import { ScriptType } from './transaction';

/**
 * Port of the six `WalletWasabi.Tests/UnitTests/BlockchainAnalysis/*.cs` suites.
 *
 * These drive `BlockchainAnalyzer.Analyze` directly, which is the only way to reach the
 * receive / normal-spend / self-spend / coinjoin dispatch and the address-reuse rules with
 * controlled inputs — the `get-anonymity-scores` request shape cannot express an input
 * with a chosen starting anonymity score.
 */

const coins = (btc: number) => Math.round(btc * 100_000_000);
const DEFAULT = DEFAULT_HIGH_ANONYMITY_SET;

/** `ReceiveAnonScoreTests` — no inputs of the transaction are controlled by the user. */
describe('receive', () => {
    it('normal receive', () => {
        const tx = createSmartTransaction({
            othersInputCount: 1,
            othersOutputs: [{ value: coins(1) }],
            ownOutputs: [{ value: coins(1), anonset: 1 }],
        });

        analyze(tx);

        expect(tx.walletOutputs).toHaveLength(1);
        expect(tx.walletOutputs[0]!.pubKey.anonymitySet).toBe(1);
    });

    it('whole coin receive', () => {
        const tx = createSmartTransaction({
            othersInputCount: 1,
            ownOutputs: [{ value: coins(1), anonset: 1 }],
        });

        analyze(tx);

        expect(tx.walletOutputs[0]!.pubKey.anonymitySet).toBe(1);
    });

    it('coinjoin receive', () => {
        const tx = createSmartTransaction({
            othersInputCount: 10,
            othersOutputs: Array.from({ length: 9 }, () => ({ value: coins(1) })),
            ownOutputs: [{ value: coins(1), anonset: DEFAULT }],
        });

        analyze(tx);

        expect(tx.walletOutputs[0]!.pubKey.anonymitySet).toBe(1);
    });
});

/** `WalletIrrelevantAnonScoreTests` — nothing in the transaction is the user's. */
describe('wallet irrelevant', () => {
    it.each([
        [1, 1],
        [3, 3],
    ])('%i in, %i out leaves nothing to analyze', (inputs, outputs) => {
        const tx = createSmartTransaction({
            othersInputCount: inputs,
            othersOutputs: Array.from({ length: outputs }, () => ({ value: coins(1) })),
        });

        expect(() => analyze(tx)).not.toThrow();
        expect(tx.walletInputs).toHaveLength(0);
        expect(tx.walletOutputs).toHaveLength(0);
    });
});

/** `NormalSpendAnonScoreTests` — all the inputs are the user's, some outputs are not. */
describe('normal spend', () => {
    it.each([
        [1, 1, 0],
        [1, 3, 0],
        [3, 1, 0],
        [1, 1, 1],
        [3, 1, 3],
        [1, 3, 1],
        [3, 3, 3],
    ])(
        '%i foreign outputs, %i own inputs, %i own outputs all drop to one',
        (othersOutputCount, ownInputCount, ownOutputCount) => {
            const tx = createSmartTransaction({
                othersInputCount: 0,
                othersOutputs: Array.from({ length: othersOutputCount }, () => ({
                    value: coins(1),
                })),
                ownInputs: Array.from({ length: ownInputCount }, () => ({
                    value: coins(1.1),
                    anonset: 3,
                })),
                ownOutputs: Array.from({ length: ownOutputCount }, () => ({
                    value: coins(1),
                    anonset: DEFAULT,
                })),
            });

            analyze(tx);

            tx.walletInputs.forEach(x => expect(x.pubKey.anonymitySet).toBe(1));
            tx.walletOutputs.forEach(x => expect(x.pubKey.anonymitySet).toBe(1));
        },
    );
});

/** `SelfSpendAnonScoreTests` — everything in the transaction is the user's. */
describe('self spend', () => {
    it.each([
        [1, 1],
        [1, 3],
    ])('one own input, %i own output(s) retains the input anonset', (_ownIn, ownOutputCount) => {
        const tx = createSmartTransaction({
            othersInputCount: 0,
            ownInputs: [{ value: coins(1.1), anonset: 3 }],
            ownOutputs: Array.from({ length: ownOutputCount }, () => ({
                value: coins(1),
                anonset: DEFAULT,
            })),
        });

        analyze(tx);

        tx.walletOutputs.forEach(x => expect(x.pubKey.anonymitySet).toBe(3));
        tx.walletInputs.forEach(x => expect(x.pubKey.anonymitySet).toBe(3));
    });

    it.each([1, 3])(
        'three own inputs, %i own output(s) worsens by input merging',
        ownOutputCount => {
            const smallestAnonset = 3;
            const tx = createSmartTransaction({
                othersInputCount: 0,
                ownInputs: [
                    { value: coins(1.1), anonset: smallestAnonset },
                    { value: coins(1.1), anonset: 100 },
                    { value: coins(1.1), anonset: 100 },
                ],
                ownOutputs: Array.from({ length: ownOutputCount }, () => ({
                    value: coins(1),
                    anonset: DEFAULT,
                })),
            });

            analyze(tx);

            tx.walletOutputs.forEach(x =>
                expect(x.pubKey.anonymitySet).toBeLessThan(smallestAnonset),
            );
            tx.walletInputs.forEach(x =>
                expect(x.pubKey.anonymitySet).toBeLessThan(smallestAnonset),
            );
        },
    );
});

/** `CoinJoinAnonscoreTests`. */
describe('coinjoin', () => {
    const basicCoinjoin = (ownInputAnonset: number) =>
        createSmartTransaction({
            othersInputCount: 9,
            othersOutputs: Array.from({ length: 9 }, () => ({ value: coins(1) })),
            ownInputs: [{ value: coins(1.1), anonset: ownInputAnonset }],
            ownOutputs: [{ value: coins(1), anonset: DEFAULT }],
        });

    it('basic calculation', () => {
        const tx = basicCoinjoin(1);

        analyze(tx);

        expect(tx.walletInputs[0]!.pubKey.anonymitySet).toBe(1);
        // 10 participants, 1 is you, your anonset is 10.
        expect(tx.walletOutputs[0]!.pubKey.anonymitySet).toBe(10);
    });

    it('double processing', () => {
        const tx = basicCoinjoin(1);

        analyze(tx);
        analyze(tx);

        expect(tx.walletInputs[0]!.pubKey.anonymitySet).toBe(1);
        expect(tx.walletOutputs[0]!.pubKey.anonymitySet).toBe(10);
    });

    it('inheritance', () => {
        const tx = basicCoinjoin(100);

        analyze(tx);

        expect(tx.walletInputs[0]!.pubKey.anonymitySet).toBe(100);
        // 10 participants, 1 is you; anonset 10 plus 99 inherited, not counting yourself twice.
        expect(tx.walletOutputs[0]!.pubKey.anonymitySet).toBe(109);
    });

    it('change output', () => {
        const tx = createSmartTransaction({
            othersInputCount: 9,
            othersOutputs: Array.from({ length: 9 }, () => ({ value: coins(1) })),
            ownInputs: [{ value: coins(6.2), anonset: 1 }],
            ownOutputs: [
                { value: coins(1), anonset: DEFAULT },
                { value: coins(5), anonset: DEFAULT },
            ],
        });

        analyze(tx);

        const active = tx.walletOutputs.find(x => x.amount === coins(1))!;
        const change = tx.walletOutputs.find(x => x.amount === coins(5))!;

        expect(tx.walletInputs[0]!.pubKey.anonymitySet).toBe(1);
        expect(active.pubKey.anonymitySet).toBe(10);
        expect(change.pubKey.anonymitySet).toBe(1);
    });

    it('change output conservative consolidation', () => {
        const tx = createSmartTransaction({
            othersInputCount: 9,
            othersOutputs: Array.from({ length: 9 }, () => ({ value: coins(1) })),
            ownInputs: [
                { value: coins(3.1), anonset: 1 },
                { value: coins(3.1), anonset: 100 },
            ],
            ownOutputs: [
                { value: coins(1), anonset: DEFAULT },
                { value: coins(5), anonset: DEFAULT },
            ],
        });

        analyze(tx);

        const active = tx.walletOutputs.find(x => x.amount === coins(1))!;
        const change = tx.walletOutputs.find(x => x.amount === coins(5))!;

        expect(tx.walletInputs[0]!.pubKey.anonymitySet).toBe(1);
        expect(active.pubKey.anonymitySet).toBe(59.5);
        expect(change.pubKey.anonymitySet).toBe(1);
    });

    it('change output inheritance', () => {
        const tx = createSmartTransaction({
            othersInputCount: 9,
            othersOutputs: Array.from({ length: 9 }, () => ({ value: coins(1) })),
            ownInputs: [{ value: coins(6.2), anonset: 100 }],
            ownOutputs: [
                { value: coins(1), anonset: DEFAULT },
                { value: coins(5), anonset: DEFAULT },
            ],
        });

        analyze(tx);

        expect(tx.walletInputs[0]!.pubKey.anonymitySet).toBe(100);
        expect(tx.walletOutputs.find(x => x.amount === coins(1))!.pubKey.anonymitySet).toBe(109);
        expect(tx.walletOutputs.find(x => x.amount === coins(5))!.pubKey.anonymitySet).toBe(100);
    });

    it('multi denomination', () => {
        // Multiple standard denomination outputs are accounted separately.
        const tx = createSmartTransaction({
            othersInputCount: 9,
            othersOutputs: [1, 1, 1, 2, 2].map(x => ({ value: coins(x) })),
            ownInputs: [{ value: coins(3.2), anonset: 1 }],
            ownOutputs: [
                { value: coins(1), anonset: DEFAULT },
                { value: coins(2), anonset: DEFAULT },
            ],
        });

        analyze(tx);

        expect(tx.walletInputs[0]!.pubKey.anonymitySet).toBe(1);
        expect(tx.walletOutputs.find(x => x.amount === coins(1))!.pubKey.anonymitySet).toBe(4);
        expect(tx.walletOutputs.find(x => x.amount === coins(2))!.pubKey.anonymitySet).toBe(3);
    });

    it('multi denomination inheritance', () => {
        const tx = createSmartTransaction({
            othersInputCount: 9,
            othersOutputs: [1, 1, 1, 2, 2].map(x => ({ value: coins(x) })),
            ownInputs: [{ value: coins(3.2), anonset: 100 }],
            ownOutputs: [
                { value: coins(1), anonset: DEFAULT },
                { value: coins(2), anonset: DEFAULT },
            ],
        });

        analyze(tx);

        expect(tx.walletInputs[0]!.pubKey.anonymitySet).toBe(100);
        expect(tx.walletOutputs.find(x => x.amount === coins(1))!.pubKey.anonymitySet).toBe(103);
        expect(tx.walletOutputs.find(x => x.amount === coins(2))!.pubKey.anonymitySet).toBe(102);
    });

    it('self anonset sanity check', () => {
        // Multiple same-denomination outputs of ours: our anonset is total/ours.
        const tx = createSmartTransaction({
            othersInputCount: 9,
            othersOutputs: [1, 1, 1].map(x => ({ value: coins(x) })),
            ownInputs: [{ value: coins(3.2), anonset: 1 }],
            ownOutputs: [1, 1].map(x => ({ value: coins(x), anonset: DEFAULT })),
        });

        analyze(tx);

        expect(tx.walletInputs[0]!.pubKey.anonymitySet).toBe(1);
        tx.walletOutputs.forEach(x => expect(x.pubKey.anonymitySet).toBe(5 / 2));
    });

    it('self anonset sanity check 2', () => {
        const tx = createSmartTransaction({
            othersInputCount: 1,
            othersOutputs: [{ value: coins(1) }],
            ownInputs: [{ value: coins(4.2), anonset: 4 }],
            ownOutputs: [1, 1, 1, 1].map(x => ({ value: coins(x), anonset: DEFAULT })),
        });

        expect(tx.walletInputs[0]!.pubKey.anonymitySet).toBe(4);

        analyze(tx);

        expect(tx.walletInputs[0]!.pubKey.anonymitySet).toBe(4);
        // One equal non-wallet output, divided between our four, added to the inherited 4.
        tx.walletOutputs.forEach(x => expect(x.pubKey.anonymitySet).toBe(4 + 1 / 4));
    });

    it('input sanity check — anonset can never exceed the number of inputs', () => {
        const tx = createSmartTransaction({
            othersInputCount: 2,
            othersOutputs: Array.from({ length: 9 }, () => ({ value: coins(1) })),
            ownInputs: [{ value: coins(1.1), anonset: 1 }],
            ownOutputs: [{ value: coins(1), anonset: DEFAULT }],
        });

        analyze(tx);

        expect(tx.walletInputs[0]!.pubKey.anonymitySet).toBe(1);
        expect(tx.walletOutputs[0]!.pubKey.anonymitySet).toBe(3);
    });

    it('self anonset sanity is applied before input sanity', () => {
        const tx = createSmartTransaction({
            othersInputCount: 1,
            othersOutputs: [1, 1, 1].map(x => ({ value: coins(x) })),
            ownInputs: [{ value: coins(3.2), anonset: 1 }],
            ownOutputs: [1, 1].map(x => ({ value: coins(x), anonset: DEFAULT })),
        });

        analyze(tx);

        expect(tx.walletInputs[0]!.pubKey.anonymitySet).toBe(1);
        // Naively 3, but only one non-wallet input limits it: 1 + min(3/2, 1) = 2.
        tx.walletOutputs.forEach(x => expect(x.pubKey.anonymitySet).toBe(2));
    });

    it('input merge punishment does not punish output indistinguishability gains', () => {
        const tx = createSmartTransaction({
            othersInputCount: 9,
            othersOutputs: Array.from({ length: 9 }, () => ({ value: coins(1) })),
            ownInputs: [1.1, 1.2, 1.3, 1.4].map(x => ({ value: coins(x), anonset: 1 })),
            ownOutputs: [{ value: coins(1), anonset: DEFAULT }],
        });

        analyze(tx);

        tx.walletInputs.forEach(x => expect(x.pubKey.anonymitySet).toBe(1));
        expect(tx.walletOutputs[0]!.pubKey.anonymitySet).toBe(10);
    });

    describe('WabiSabi 2 change handling', () => {
        const ownInputs = [
            { value: coins(1.1), anonset: 100 },
            { value: coins(1.2), anonset: 1 },
        ];
        const weightedAverage = Math.trunc(
            ownInputs.reduce((total, x) => total + x.value * x.anonset, 0) /
                ownInputs.reduce((total, x) => total + x.value, 0),
        );
        const maxPunishment = Math.min(...ownInputs.map(x => x.anonset));
        const othersOutputCount = 9;

        it('input merging with non-standard change gives maximum punishment', () => {
            const tx = createSmartTransaction({
                othersInputCount: 50,
                othersOutputs: Array.from({ length: othersOutputCount }, () => ({
                    value: coins(1),
                })),
                ownInputs,
                ownOutputs: [
                    { value: coins(1), anonset: DEFAULT },
                    { value: 5001, anonset: DEFAULT },
                ],
            });

            analyze(tx);

            const active = maxBy(tx.walletOutputs, x => x.amount);
            const change = minBy(tx.walletOutputs, x => x.amount);

            expect(Math.round(active.pubKey.anonymitySet)).toBe(
                weightedAverage + othersOutputCount,
            );
            expect(Math.round(change.pubKey.anonymitySet)).toBe(maxPunishment);
        });

        it('input merging with a small unique denom gives no punishment', () => {
            const tx = createSmartTransaction({
                othersInputCount: 50,
                othersOutputs: Array.from({ length: othersOutputCount }, () => ({
                    value: coins(1),
                })),
                ownInputs,
                ownOutputs: [
                    { value: coins(1), anonset: DEFAULT },
                    { value: 5000, anonset: DEFAULT },
                ],
                orderByAmount: true,
            });

            expect(tx.isWasabi2Cj).toBe(true);

            analyze(tx);

            const active = maxBy(tx.walletOutputs, x => x.amount);
            const change = minBy(tx.walletOutputs, x => x.amount);

            expect(Math.round(active.pubKey.anonymitySet)).toBe(
                weightedAverage + othersOutputCount,
            );
            expect(Math.round(change.pubKey.anonymitySet)).not.toBe(maxPunishment);
            expect(Math.round(change.pubKey.anonymitySet)).toBe(weightedAverage);
        });

        it('input merging with a large unique denom punishes against the largest inputs', () => {
            const largeOwnInputs = [
                { value: coins(1.1), anonset: 100 },
                { value: coins(2.2), anonset: 1 },
            ];
            const largeWeightedAverage = Math.trunc(
                largeOwnInputs.reduce((total, x) => total + x.value * x.anonset, 0) /
                    largeOwnInputs.reduce((total, x) => total + x.value, 0),
            );
            const tx = createSmartTransaction({
                othersInputCount: 50,
                othersOutputs: Array.from({ length: othersOutputCount }, () => ({
                    value: coins(1),
                })),
                ownInputs: largeOwnInputs,
                ownOutputs: [
                    { value: coins(1), anonset: DEFAULT },
                    { value: coins(2), anonset: DEFAULT },
                ],
                orderByAmount: true,
            });

            expect(tx.isWasabi2Cj).toBe(true);

            analyze(tx);

            const active = minBy(tx.walletOutputs, x => x.amount);
            const change = maxBy(tx.walletOutputs, x => x.amount);

            expect(Math.round(active.pubKey.anonymitySet)).toBe(
                largeWeightedAverage + othersOutputCount,
            );
            expect(Math.round(change.pubKey.anonymitySet)).not.toBe(largeWeightedAverage);
            expect(Math.round(change.pubKey.anonymitySet)).toBe(
                Math.min(...largeOwnInputs.map(x => x.anonset)),
            );
        });

        it('punishment against the largest inputs stays reasonable', () => {
            const reasonableInputs = [
                { value: coins(1.1), anonset: 1 },
                { value: coins(55), anonset: 100 },
                { value: coins(45), anonset: 3 },
            ];
            const reasonableWeightedAverage = Math.trunc(
                reasonableInputs.reduce((total, x) => total + x.value * x.anonset, 0) /
                    reasonableInputs.reduce((total, x) => total + x.value, 0),
            );
            const tx = createSmartTransaction({
                othersInputCount: 50,
                othersOutputs: Array.from({ length: othersOutputCount }, () => ({
                    value: coins(1),
                })),
                ownInputs: reasonableInputs,
                ownOutputs: [
                    { value: coins(1), anonset: DEFAULT },
                    { value: coins(100), anonset: DEFAULT },
                ],
                orderByAmount: true,
            });

            expect(tx.isWasabi2Cj).toBe(true);

            analyze(tx);

            const active = minBy(tx.walletOutputs, x => x.amount);
            const change = maxBy(tx.walletOutputs, x => x.amount);

            expect(Math.trunc(active.pubKey.anonymitySet)).toBe(
                reasonableWeightedAverage + othersOutputCount,
            );
            expect(Math.round(change.pubKey.anonymitySet)).not.toBe(reasonableWeightedAverage);
            expect(Math.round(change.pubKey.anonymitySet)).toBe(3);
        });

        it('punishment against the largest inputs stays reasonable for several denoms', () => {
            const reasonableInputs = [
                { value: coins(1.1), anonset: 1 },
                { value: coins(55), anonset: 100 },
                { value: coins(45), anonset: 3 },
            ];
            const reasonableWeightedAverage = Math.trunc(
                reasonableInputs.reduce((total, x) => total + x.value * x.anonset, 0) /
                    reasonableInputs.reduce((total, x) => total + x.value, 0),
            );
            const tx = createSmartTransaction({
                othersInputCount: 50,
                othersOutputs: Array.from({ length: othersOutputCount }, () => ({
                    value: coins(1),
                })),
                ownInputs: reasonableInputs,
                ownOutputs: [
                    { value: 5000, anonset: DEFAULT },
                    { value: coins(1), anonset: DEFAULT },
                    { value: coins(20), anonset: DEFAULT },
                    { value: coins(20), anonset: DEFAULT },
                    { value: coins(50), anonset: DEFAULT },
                ],
                orderByAmount: true,
            });

            expect(tx.isWasabi2Cj).toBe(true);

            analyze(tx);

            const at = (amount: number, skip = 0) =>
                tx.walletOutputs.filter(x => x.amount === amount)[skip]!.pubKey.anonymitySet;

            expect(Math.trunc(at(5000))).toBe(reasonableWeightedAverage);
            expect(Math.trunc(at(coins(1)))).toBe(reasonableWeightedAverage + othersOutputCount);
            expect(Math.round(at(coins(20)))).toBe(3);
            expect(Math.round(at(coins(20), 1))).toBe(3);
            expect(Math.round(at(coins(50)))).toBe(3);
        });
    });

    it('a different script type does not contribute to the anon score', () => {
        const builder = new AnalyzedTransactionBuilder();
        builder.addForeignInput();
        builder.addForeignInput();
        builder.addForeignInput();
        builder.addWalletInput();
        builder.addForeignOutput();
        builder.addForeignOutput();
        builder.addForeignOutput();
        builder.addForeignOutput();
        builder.addForeignOutput(100_000_000, ScriptType.P2PKH);
        builder.addWalletOutput();
        const a = builder.addWalletOutput();

        builder.analyzeRecursively();

        expect(a.pubKey.anonymitySet).toBe(3);
    });

    it('a sibling coinjoin does not contribute to the anon score', () => {
        const tx1 = new AnalyzedTransactionBuilder();
        tx1.addForeignInput();
        tx1.addWalletInput();
        const a = tx1.addForeignOutput();
        const b = tx1.addWalletOutput();

        const tx2 = new AnalyzedTransactionBuilder();
        tx2.addForeignInput(a);
        tx2.addWalletInputCoin(b);
        tx2.addForeignOutput();
        const f = tx2.addWalletOutput();

        tx2.analyzeRecursively();

        expect(b.pubKey.anonymitySet).toBe(2);
        expect(f.pubKey.anonymitySet).toBe(2);
    });

    it('an earlier sibling coinjoin does not contribute to the anon score', () => {
        const tx1 = new AnalyzedTransactionBuilder();
        tx1.addForeignInput();
        tx1.addWalletInput(100_000_000, 10);
        const a = tx1.addForeignOutput();
        const b = tx1.addWalletOutput();

        const tx2 = new AnalyzedTransactionBuilder();
        tx2.addForeignInput();
        tx2.addWalletInputCoin(b);
        const c = tx2.addForeignOutput();
        const d = tx2.addWalletOutput();
        const e = tx2.addWalletOutput();

        const tx3 = new AnalyzedTransactionBuilder();
        tx3.addForeignInput(a);
        tx3.addForeignInput(c);
        tx3.addWalletInputCoin(d);
        tx3.addForeignOutput();
        tx3.addForeignOutput();
        tx3.addForeignOutput();
        const l = tx3.addWalletOutput();

        tx3.analyzeRecursively();

        expect(b.pubKey.anonymitySet).toBe(11);
        expect(d.pubKey.anonymitySet).toBe(11.5);
        expect(e.pubKey.anonymitySet).toBe(11.5);
        expect(l.pubKey.anonymitySet).toBe(12);
    });
});

/** `PubKeyReuseAnonScoreTests`. */
describe('pubkey reuse', () => {
    const nineOthers = () => Array.from({ length: 9 }, () => ({ value: coins(1) }));

    it('address reuse punishment', () => {
        const reuse = createPubKey();
        const tx = createSmartTransaction({
            othersInputCount: 9,
            othersOutputs: nineOthers(),
            ownInputs: [{ value: coins(1.1), anonset: 100 }],
            ownOutputs: [{ value: coins(1), anonset: DEFAULT, pubKey: reuse }],
        });
        // Smaller than the 109 the output would otherwise get, and recorded against
        // another transaction so it reads as reuse.
        reuse.setAnonymitySet(30, 'earlier-transaction');

        analyze(tx);

        tx.walletInputs.forEach(x => expect(x.pubKey.anonymitySet).toBeLessThan(30));
        expect(tx.walletOutputs[0]!.pubKey.anonymitySet).toBeLessThan(30);
    });

    it('address reuse punishment is idempotent when processed twice', () => {
        const reuse = createPubKey();
        const tx = createSmartTransaction({
            othersInputCount: 9,
            othersOutputs: nineOthers(),
            ownInputs: [{ value: coins(1.1), anonset: 100 }],
            ownOutputs: [{ value: coins(1), anonset: DEFAULT, pubKey: reuse }],
        });
        reuse.setAnonymitySet(30, 'earlier-transaction');

        analyze(tx);
        const inputAnonsets = tx.walletInputs.map(x => x.pubKey.anonymitySet);
        const outputAnonsets = tx.walletOutputs.map(x => x.pubKey.anonymitySet);

        analyze(tx);

        expect(tx.walletInputs.map(x => x.pubKey.anonymitySet)).toEqual(inputAnonsets);
        expect(tx.walletOutputs.map(x => x.pubKey.anonymitySet)).toEqual(outputAnonsets);
    });

    it('self spend reuse', () => {
        const reuse = createPubKey();
        const tx = createSmartTransaction({
            othersInputCount: 0,
            ownInputs: [{ value: coins(1.1), anonset: 100 }],
            ownOutputs: [{ value: coins(1), anonset: DEFAULT, pubKey: reuse }],
        });
        reuse.setAnonymitySet(30, 'earlier-transaction');

        analyze(tx);

        tx.walletInputs.forEach(x => expect(x.pubKey.anonymitySet).toBeLessThan(30));
        expect(tx.walletOutputs[0]!.pubKey.anonymitySet).toBeLessThan(30);
    });

    it('address reuse is irrelevant in a normal spend', () => {
        const key = createPubKey();
        const tx = createSmartTransaction({
            othersInputCount: 0,
            othersOutputs: nineOthers(),
            ownInputs: [1.1, 1.2, 1.3, 1.4].map(x => ({
                value: coins(x),
                anonset: 100,
                pubKey: key,
            })),
            ownOutputs: [{ value: coins(1), anonset: DEFAULT }],
        });

        analyze(tx);

        tx.walletInputs.forEach(x => expect(x.pubKey.anonymitySet).toBe(1));
        expect(tx.walletOutputs[0]!.pubKey.anonymitySet).toBe(1);
    });

    it('input side address reuse has no consolidation punishment in a self spend', () => {
        const key = createPubKey();
        const tx = createSmartTransaction({
            othersInputCount: 0,
            ownInputs: [1.1, 1.2, 1.3, 1.4].map(x => ({
                value: coins(x),
                anonset: 100,
                pubKey: key,
            })),
            ownOutputs: [{ value: coins(1), anonset: DEFAULT }],
        });

        analyze(tx);

        tx.walletInputs.forEach(x => expect(x.pubKey.anonymitySet).toBe(100));
        expect(tx.walletOutputs[0]!.pubKey.anonymitySet).toBe(100);
    });

    it('input side address reuse has no consolidation punishment in a coinjoin', () => {
        const key = createPubKey();
        const tx = createSmartTransaction({
            othersInputCount: 9,
            othersOutputs: nineOthers(),
            ownInputs: [1.1, 1.2, 1.3, 1.4].map(x => ({
                value: coins(x),
                anonset: 100,
                pubKey: key,
            })),
            ownOutputs: [{ value: coins(1), anonset: DEFAULT }],
        });

        analyze(tx);

        tx.walletInputs.forEach(x => expect(x.pubKey.anonymitySet).toBe(100));
        expect(tx.walletOutputs[0]!.pubKey.anonymitySet).toBe(109);
    });

    it('reuse on both the input and the output side neither gains nor loses', () => {
        const key = createPubKey();
        const tx = createSmartTransaction({
            othersInputCount: 9,
            othersOutputs: nineOthers(),
            ownInputs: [{ value: coins(1.1), anonset: 100, pubKey: key }],
            ownOutputs: [{ value: coins(1), anonset: DEFAULT, pubKey: key }],
        });

        analyze(tx);

        tx.walletInputs.forEach(x => expect(x.pubKey.anonymitySet).toBe(100));
        expect(tx.walletOutputs[0]!.pubKey.anonymitySet).toBe(100);
    });

    it('reuse of a previously used output address adjusts the inputs down too', () => {
        const reuse = createPubKey();
        const tx = createSmartTransaction({
            othersInputCount: 9,
            othersOutputs: nineOthers(),
            ownInputs: [{ value: coins(1.1), anonset: 100 }],
            ownOutputs: [{ value: coins(1), anonset: DEFAULT, pubKey: reuse }],
        });
        reuse.setAnonymitySet(30, 'earlier-transaction');

        analyze(tx);

        expect(tx.walletOutputs[0]!.pubKey.anonymitySet).toBeLessThan(30);
        tx.walletInputs.forEach(x => expect(x.pubKey.anonymitySet).toBeLessThan(30));
    });

    it('output side address reuse is punished', () => {
        const key = createPubKey();
        const tx = createSmartTransaction({
            othersInputCount: 9,
            othersOutputs: [
                ...Array.from({ length: 9 }, () => ({ value: coins(1) })),
                ...Array.from({ length: 7 }, () => ({ value: coins(2) })),
            ],
            ownInputs: [{ value: coins(1.1), anonset: 100 }],
            ownOutputs: [
                { value: coins(1), anonset: DEFAULT, pubKey: key },
                { value: coins(2), anonset: DEFAULT, pubKey: key },
            ],
        });

        analyze(tx);

        tx.walletInputs.forEach(x => expect(x.pubKey.anonymitySet).toBe(100));
        // Normally 109 and 106, but they are consolidated and punished.
        tx.walletOutputs.forEach(x => expect(x.pubKey.anonymitySet).toBeLessThan(106));
    });

    it('output side address reuse is not punished more than inheritance', () => {
        const key = createPubKey();
        const tx = createSmartTransaction({
            othersInputCount: 9,
            othersOutputs: [
                ...repeat(9, coins(1)),
                ...repeat(8, coins(2)),
                ...repeat(7, coins(3)),
                ...repeat(6, coins(4)),
                ...repeat(5, coins(5)),
                ...repeat(4, coins(6)),
            ],
            ownInputs: [{ value: coins(1.1), anonset: 100 }],
            ownOutputs: [1, 2, 3, 4, 5, 6].map(x => ({
                value: coins(x),
                anonset: DEFAULT,
                pubKey: key,
            })),
        });

        analyze(tx);

        tx.walletInputs.forEach(x => expect(x.pubKey.anonymitySet).toBe(100));
        // 100 is the input anonset, so the outputs shouldn't go below it.
        tx.walletOutputs.forEach(x => expect(x.pubKey.anonymitySet).toBeGreaterThanOrEqual(100));
    });

    it('output side address reuse by someone else does not grant us their anonset', () => {
        // https://github.com/zkSNACKs/WalletWasabi/pull/4724#discussion_r530847724
        const reusedScript = createScript();
        const tx = createSmartTransaction({
            othersInputCount: 9,
            othersOutputs: [
                ...repeat(7, coins(1)),
                { value: coins(1), scriptPubKey: reusedScript },
                { value: coins(1), scriptPubKey: reusedScript },
            ],
            ownInputs: [{ value: coins(1.1), anonset: 1 }],
            ownOutputs: [{ value: coins(1), anonset: DEFAULT }],
        });

        analyze(tx);

        tx.walletInputs.forEach(x => expect(x.pubKey.anonymitySet).toBe(1));
        // Normally 10, but because of the reuse it is only 8.
        expect(tx.walletOutputs[0]!.pubKey.anonymitySet).toBe(8);
    });

    it('does not throw for a coinjoin with no own outputs', () => {
        const tx = createSmartTransaction({
            othersInputCount: 2,
            othersOutputs: repeat(2, coins(1)),
            ownInputs: Array.from({ length: 40 }, () => ({ value: coins(1.1), anonset: 1 })),
        });

        expect(() => analyze(tx)).not.toThrow();
    });
});

const repeat = (count: number, value: number) => Array.from({ length: count }, () => ({ value }));

const maxBy = <T>(source: readonly T[], key: (item: T) => number) =>
    source.reduce((best, item) => (key(item) > key(best) ? item : best));

const minBy = <T>(source: readonly T[], key: (item: T) => number) =>
    source.reduce((best, item) => (key(item) < key(best) ? item : best));

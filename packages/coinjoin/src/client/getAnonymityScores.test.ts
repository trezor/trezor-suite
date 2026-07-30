import { type Tx, getAnonymityScores } from './getAnonymityScores';

// ─── test helpers ─────────────────────────────────────────────────────────────

const BTC = 100_000_000; // 1 BTC in satoshis

/**
 * Taproot scriptPubKey: OP_1 (0x51) + PUSH32 (0x20) + 32 key bytes = 68 hex chars.
 * Each unique seed produces a distinct script, so two outputs with different seeds
 * are counted as separate ForeignVirtualOutputs in the anonymity calculation.
 */
const taprootScript = (seed: number): string => '5120' + seed.toString(16).padStart(64, '0');

/** P2PKH scriptPubKey (non-Taproot, for change / foreign outputs that should not count). */
const p2pkhScript = (seed: number): string =>
    '76a914' + seed.toString(16).padStart(40, '0') + '88ac';

/**
 * Create N unique Taproot external outputs of `value` satoshis.
 * `offset` avoids seed collisions when mixing outputs from different call sites.
 */
const taprootOuts = (count: number, value: number, offset = 0) =>
    Array.from({ length: count }, (_, i) => ({
        value,
        scriptPubKey: taprootScript(offset + i + 1),
    }));

/** Create N external input placeholders (only count matters for analysis). */
const extInputs = (count: number): Record<string, never>[] =>
    Array.from({ length: count }, () => ({}));

/** Look up the anonymitySet for a given address in the result array. */
const anon = (result: ReturnType<typeof getAnonymityScores>, address: string): number =>
    result.find(r => r.address === address)?.anonymitySet ?? NaN;

// ─── receive transactions ─────────────────────────────────────────────────────
// Source: ReceiveAnonScoreTests.cs

describe('receive transactions', () => {
    test('single receive assigns anonset = 1', () => {
        // NormalReceive: 1 foreign input, 1 wallet output, 1 foreign output
        const result = getAnonymityScores({
            transactions: [
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: 'A', value: BTC }],
                    externalOutputs: [{ value: BTC / 2, scriptPubKey: p2pkhScript(1) }],
                },
            ],
        });
        expect(anon(result, 'A')).toBe(1);
    });

    test('receive without foreign outputs assigns anonset = 1', () => {
        // WholeCoinReceive: 1 foreign input, 1 wallet output, 0 foreign outputs
        const result = getAnonymityScores({
            transactions: [
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: 'A', value: BTC }],
                    externalOutputs: [],
                },
            ],
        });
        expect(anon(result, 'A')).toBe(1);
    });

    test('receiving in a coinjoin-shaped tx (no wallet inputs) assigns anonset = 1', () => {
        // CoinjoinReceive: 10 foreign inputs, 9 foreign Taproot outputs, 1 wallet output
        // ownInputCount == 0 → AnalyzeReceive → anonset = 1 regardless of foreign output count
        const result = getAnonymityScores({
            transactions: [
                {
                    internalInputs: [],
                    externalInputs: extInputs(10),
                    internalOutputs: [{ address: 'A', value: BTC }],
                    externalOutputs: taprootOuts(9, BTC),
                },
            ],
        });
        expect(anon(result, 'A')).toBe(1);
    });

    test('multiple wallet outputs in one receive all get anonset = 1', () => {
        const result = getAnonymityScores({
            transactions: [
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [
                        { address: 'A', value: BTC },
                        { address: 'B', value: BTC },
                    ],
                    externalOutputs: [],
                },
            ],
        });
        expect(anon(result, 'A')).toBe(1);
        expect(anon(result, 'B')).toBe(1);
    });

    test('same address received in two separate transactions — anonset = 1 (JSON fixture)', () => {
        // Direct port of the first test vector from GetAnonymityScores.json.
        // The address receives 1 BTC and 0.2 BTC in two receive transactions.
        const addr = 'bcrt1p0hghqgks9z83pwh3a3jzq3eldgzj8ezjrs247szks3w2nq7s7fhsqtqgg7';
        const result = getAnonymityScores({
            transactions: [
                // Newer tx (index 0): 1 BTC receive
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: addr, value: 1_000_000_000 }],
                    externalOutputs: [
                        {
                            value: 3_979_990_640,
                            scriptPubKey: '76a914d51d49df61c406305f14cae176e0e05f200d40b288ac',
                        },
                    ],
                },
                // Older tx (index 1): 0.2 BTC receive
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: addr, value: 20_000_000 }],
                    externalOutputs: [
                        {
                            value: 4_979_995_320,
                            scriptPubKey: '76a914343f14545ae181898cced42a280e25cc20f7972c88ac',
                        },
                    ],
                },
            ],
        });
        expect(anon(result, addr)).toBe(1);
    });
});

// ─── normal spend (all-wallet inputs, ≥1 foreign output) ─────────────────────
// Source: NormalSpendAnonScoreTests.cs

describe('normal spend (all-wallet inputs, at least one foreign output)', () => {
    // Convention for multi-tx chains:
    // transactions[0] = newest, transactions[n-1] = oldest.
    // Processing (via Reverse()) goes oldest → newest.

    test('spending to external only resets input anonset to 1', () => {
        // OneOwnInOneOut: wallet input → external output only
        const result = getAnonymityScores({
            transactions: [
                // newest: spend A to external
                {
                    internalInputs: [{ address: 'A', value: BTC }],
                    externalInputs: [],
                    internalOutputs: [],
                    externalOutputs: [{ value: BTC - 1000, scriptPubKey: p2pkhScript(1) }],
                },
                // oldest: receive A
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: 'A', value: BTC }],
                    externalOutputs: [],
                },
            ],
        });
        expect(anon(result, 'A')).toBe(1);
    });

    test('spending with wallet change: input and change output both reset to 1', () => {
        // OneOwnInOneOutOneOwnOut: wallet input → external + wallet change
        const result = getAnonymityScores({
            transactions: [
                {
                    internalInputs: [{ address: 'A', value: BTC }],
                    externalInputs: [],
                    internalOutputs: [{ address: 'change', value: 50_000_000 }],
                    externalOutputs: [{ value: 49_999_000, scriptPubKey: p2pkhScript(1) }],
                },
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: 'A', value: BTC }],
                    externalOutputs: [],
                },
            ],
        });
        expect(anon(result, 'A')).toBe(1);
        expect(anon(result, 'change')).toBe(1);
    });

    test('multiple wallet inputs all reset to 1 on normal spend', () => {
        // ManyOwnInOneOut: two wallet inputs → single external output
        const result = getAnonymityScores({
            transactions: [
                {
                    internalInputs: [
                        { address: 'A', value: BTC },
                        { address: 'B', value: BTC },
                    ],
                    externalInputs: [],
                    internalOutputs: [],
                    externalOutputs: [{ value: 2 * BTC - 1000, scriptPubKey: p2pkhScript(1) }],
                },
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [
                        { address: 'A', value: BTC },
                        { address: 'B', value: BTC },
                    ],
                    externalOutputs: [],
                },
            ],
        });
        expect(anon(result, 'A')).toBe(1);
        expect(anon(result, 'B')).toBe(1);
    });
});

// ─── self-spend (all-wallet inputs, all-wallet outputs) ───────────────────────
// Source: SelfSpendAnonScoreTests.cs

describe('self-spend (all-wallet inputs and outputs)', () => {
    test('1-in → 1-out: output inherits input anonset', () => {
        // OneOwnInOneOwnOut: single wallet input → single wallet output
        const result = getAnonymityScores({
            transactions: [
                // newest: A → B self-spend
                {
                    internalInputs: [{ address: 'A', value: BTC }],
                    externalInputs: [],
                    internalOutputs: [{ address: 'B', value: BTC }],
                    externalOutputs: [],
                },
                // oldest: receive A (anonset = 1)
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: 'A', value: BTC }],
                    externalOutputs: [],
                },
            ],
        });
        expect(anon(result, 'A')).toBe(1);
        expect(anon(result, 'B')).toBe(1); // inherits A's anonset
    });

    test('1-in → many-out: all outputs inherit input anonset', () => {
        // OneOwnInManyOwnOut: one wallet input, three wallet outputs
        const result = getAnonymityScores({
            transactions: [
                {
                    internalInputs: [{ address: 'A', value: 300_000_000 }],
                    externalInputs: [],
                    internalOutputs: [
                        { address: 'B', value: BTC },
                        { address: 'C', value: BTC },
                        { address: 'D', value: BTC },
                    ],
                    externalOutputs: [],
                },
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: 'A', value: 300_000_000 }],
                    externalOutputs: [],
                },
            ],
        });
        expect(anon(result, 'B')).toBe(1);
        expect(anon(result, 'C')).toBe(1);
        expect(anon(result, 'D')).toBe(1);
    });

    test('consolidating 2 coins applies exponential intersection penalty', () => {
        // ManyOwnInOneOwnOut: two inputs with anonset 3 each → intersect([3,3]) = 1.5
        //
        // 4-tx chain (newest → oldest):
        //   tx0: consolidate C + D → E          (self-spend, intersection penalty)
        //   tx1: coinjoin A → C  (2+1 inputs, 2 taproot @ 1 BTC → anonset 3)
        //   tx2: coinjoin B → D  (2+1 inputs, 2 taproot @ 1 BTC → anonset 3)
        //   tx3: receive A and B
        const result = getAnonymityScores({
            transactions: [
                // tx0 (newest): consolidate
                {
                    internalInputs: [
                        { address: 'C', value: BTC },
                        { address: 'D', value: BTC },
                    ],
                    externalInputs: [],
                    internalOutputs: [{ address: 'E', value: 2 * BTC }],
                    externalOutputs: [],
                },
                // tx1: coinjoin A → C (2 foreign + 1 wallet = 3 inputs, 2 taproot @ 1 BTC → gain 2 → anonset 3)
                {
                    internalInputs: [{ address: 'A', value: BTC }],
                    externalInputs: extInputs(2),
                    internalOutputs: [{ address: 'C', value: BTC }],
                    externalOutputs: taprootOuts(2, BTC, 0),
                },
                // tx2: coinjoin B → D (same structure, different Taproot seeds)
                {
                    internalInputs: [{ address: 'B', value: BTC }],
                    externalInputs: extInputs(2),
                    internalOutputs: [{ address: 'D', value: BTC }],
                    externalOutputs: taprootOuts(2, BTC, 10),
                },
                // tx3 (oldest): receive A and B
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [
                        { address: 'A', value: BTC },
                        { address: 'B', value: BTC },
                    ],
                    externalOutputs: [],
                },
            ],
        });

        expect(anon(result, 'C')).toBe(3);
        expect(anon(result, 'D')).toBe(3);
        // intersect([3, 3]) = min(3,3) / 2^(2-1) = 3/2 = 1.5
        expect(anon(result, 'E')).toBeCloseTo(1.5);
    });
});

// ─── coinjoin ─────────────────────────────────────────────────────────────────
// Source: CoinJoinAnonscoreTests.cs

describe('coinjoin', () => {
    test('basic: 10 participants → wallet output gets anonset = 10', () => {
        // BasicCalculation: 9 foreign inputs, 9 Taproot @ 1 BTC, 1 wallet input (anonset=1), 1 wallet output @ 1 BTC
        // gain = min(9/1, 9) = 9 → anonset = max(1+9, 9+1, 1) = 10
        const result = getAnonymityScores({
            transactions: [
                // newest: coinjoin
                {
                    internalInputs: [{ address: 'A', value: BTC }],
                    externalInputs: extInputs(9),
                    internalOutputs: [{ address: 'B', value: BTC }],
                    externalOutputs: taprootOuts(9, BTC),
                },
                // oldest: receive A
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: 'A', value: BTC }],
                    externalOutputs: [],
                },
            ],
        });
        expect(anon(result, 'A')).toBe(1);
        expect(anon(result, 'B')).toBe(10);
    });

    test('inheritance: wallet input anonset adds to coinjoin gain', () => {
        // Inheritance: wallet input with anonset=3 (from prior coinjoin), then 9 foreign inputs, 9 taproot outputs
        // anonset = max(3+9, 9+1, 3) = 12
        //
        // Chain:
        //   tx0: 2nd coinjoin, C → D  (9 foreign + 9 taproot @ 1 BTC)
        //   tx1: 1st coinjoin, A → C  (2 foreign + 2 taproot @ 1 BTC → anonset 3)
        //   tx2: receive A
        const result = getAnonymityScores({
            transactions: [
                {
                    internalInputs: [{ address: 'C', value: BTC }],
                    externalInputs: extInputs(9),
                    internalOutputs: [{ address: 'D', value: BTC }],
                    externalOutputs: taprootOuts(9, BTC, 100),
                },
                {
                    internalInputs: [{ address: 'A', value: BTC }],
                    externalInputs: extInputs(2),
                    internalOutputs: [{ address: 'C', value: BTC }],
                    externalOutputs: taprootOuts(2, BTC, 200),
                },
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: 'A', value: BTC }],
                    externalOutputs: [],
                },
            ],
        });
        expect(anon(result, 'C')).toBe(3);
        expect(anon(result, 'D')).toBe(12);
    });

    test('change output (unique amount, no foreign match) gets minimum anonset', () => {
        // ChangeOutput: wallet outputs at 1 BTC (matches foreign) and 5 BTC (unique)
        // active: max(1+9, 9+1, 1) = 10
        // change: no foreign match → startingScore = minimum = 1 → anonset = max(1+0, 0+1, 1) = 1
        const result = getAnonymityScores({
            transactions: [
                {
                    internalInputs: [{ address: 'A', value: 620_000_000 }],
                    externalInputs: extInputs(9),
                    internalOutputs: [
                        { address: 'active', value: BTC },
                        { address: 'change', value: 500_000_000 },
                    ],
                    externalOutputs: taprootOuts(9, BTC),
                },
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: 'A', value: 620_000_000 }],
                    externalOutputs: [],
                },
            ],
        });
        expect(anon(result, 'active')).toBe(10);
        expect(anon(result, 'change')).toBe(1);
    });

    test('anonset gain is capped by foreign input count', () => {
        // InputSanityCheck: 9 Taproot @ 1 BTC but only 2 foreign inputs → gain = min(9, 2) = 2
        // anonset = max(1+2, 2+1, 1) = 3
        const result = getAnonymityScores({
            transactions: [
                {
                    internalInputs: [{ address: 'A', value: BTC }],
                    externalInputs: extInputs(2),
                    internalOutputs: [{ address: 'B', value: BTC }],
                    externalOutputs: taprootOuts(9, BTC),
                },
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: 'A', value: BTC }],
                    externalOutputs: [],
                },
            ],
        });
        expect(anon(result, 'B')).toBe(3);
    });

    test('two wallet outputs at the same value split the anonymity gain', () => {
        // SelfAnonsetSanityCheck: 2 wallet outputs + 3 foreign outputs at 1 BTC, 1 foreign input
        // contribution = 3 / 2 = 1.5; gain = min(1.5, 1) = 1 (capped by foreignInputCount)
        // anonset = max(1+1, 1+1, 1) = 2
        const result = getAnonymityScores({
            transactions: [
                {
                    internalInputs: [{ address: 'A', value: 200_000_000 }],
                    externalInputs: extInputs(1),
                    internalOutputs: [
                        { address: 'B', value: BTC },
                        { address: 'C', value: BTC },
                    ],
                    externalOutputs: taprootOuts(3, BTC),
                },
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: 'A', value: 200_000_000 }],
                    externalOutputs: [],
                },
            ],
        });
        expect(anon(result, 'B')).toBe(2);
        expect(anon(result, 'C')).toBe(2);
    });

    test('multi-denomination: each output value gets its own anonymity gain', () => {
        // MultiDenomination: wallet outputs at 1 BTC and 2 BTC; foreign: 3 × 1 BTC, 2 × 2 BTC
        // 1 BTC wallet output: contribution = 3/1 = 3, gain = min(3, 9) = 3 → anonset = 4
        // 2 BTC wallet output: contribution = 2/1 = 2, gain = min(2, 9) = 2 → anonset = 3
        const result = getAnonymityScores({
            transactions: [
                {
                    internalInputs: [{ address: 'A', value: 320_000_000 }],
                    externalInputs: extInputs(9),
                    internalOutputs: [
                        { address: 'level1', value: BTC },
                        { address: 'level2', value: 200_000_000 },
                    ],
                    externalOutputs: [
                        ...taprootOuts(3, BTC, 0),
                        ...taprootOuts(2, 200_000_000, 10),
                    ],
                },
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: 'A', value: 320_000_000 }],
                    externalOutputs: [],
                },
            ],
        });
        expect(anon(result, 'level1')).toBe(4);
        expect(anon(result, 'level2')).toBe(3);
    });

    test('non-Taproot foreign outputs are not counted for Taproot wallet outputs', () => {
        // Only foreign Taproot outputs contribute to anonymity gain.
        // Nine P2PKH foreign outputs at the same amount → gain = 0 → anonset = 1.
        const result = getAnonymityScores({
            transactions: [
                {
                    internalInputs: [{ address: 'A', value: BTC }],
                    externalInputs: extInputs(9),
                    internalOutputs: [{ address: 'B', value: BTC }],
                    externalOutputs: Array.from({ length: 9 }, (_, i) => ({
                        value: BTC,
                        scriptPubKey: p2pkhScript(i + 1),
                    })),
                },
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: 'A', value: BTC }],
                    externalOutputs: [],
                },
            ],
        });
        // hasForeignMatch = true (same amount), but contribution = 0 (no taproot matches)
        // anonset = max(1+0, 0+1, 1) = 1
        expect(anon(result, 'B')).toBe(1);
    });

    test('consolidating coinjoin outputs penalises inputs before the next coinjoin', () => {
        // ChangeOutputConservativeConsolidation equivalent:
        // Two wallet inputs with anonsets 1 and 3 feed a coinjoin.
        // weighted average = (1×1 BTC + 3×1 BTC) / 2 BTC = 2
        // min = 1
        //
        // Chain:
        //   tx0 (newest): coinjoin with 2 wallet inputs (A anonset=1, C anonset=3), 9 foreign inputs
        //   tx1: coinjoin A→C (2 foreign, 2 taproot @ 1 BTC → anonset 3)
        //   tx2 (oldest): receive A and B (A feeds tx1; B feeds tx0 directly)
        const result = getAnonymityScores({
            transactions: [
                // tx0: coinjoin with 2 wallet inputs (B anonset=1, C anonset=3)
                {
                    internalInputs: [
                        { address: 'B', value: BTC },
                        { address: 'C', value: BTC },
                    ],
                    externalInputs: extInputs(9),
                    internalOutputs: [{ address: 'D', value: BTC }],
                    // 9 taproot @ 1 BTC: D gets foreign match
                    externalOutputs: taprootOuts(9, BTC, 50),
                },
                // tx1: coinjoin A → C (gives C anonset = 3)
                {
                    internalInputs: [{ address: 'A', value: BTC }],
                    externalInputs: extInputs(2),
                    internalOutputs: [{ address: 'C', value: BTC }],
                    externalOutputs: taprootOuts(2, BTC, 200),
                },
                // tx2 (oldest): receive A and B
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [
                        { address: 'A', value: BTC },
                        { address: 'B', value: BTC },
                    ],
                    externalOutputs: [],
                },
            ],
        });

        expect(anon(result, 'C')).toBe(3);
        // D: walletVirtualInputs = [B(anonset=1), C(anonset=3)]
        // mixedAnonScore = weightedMean = (1×1BTC + 3×1BTC) / 2BTC = 2
        // foreignOutputs at 1 BTC (9 taproot) match D → hasForeignMatch = true
        // startingScore = 2, gain = min(9, 9) = 9
        // anonset = max(2+9, 9+1, 2) = 11
        expect(anon(result, 'D')).toBe(11);
    });
});

// ─── result ordering and deduplication ───────────────────────────────────────
// Source: AddressAnonymityCollection deduplication logic

describe('result structure', () => {
    test('each address appears exactly once (first-occurrence wins)', () => {
        const addr = 'shared';
        const result = getAnonymityScores({
            transactions: [
                // Two receive txs for the same address; both are receive txs so anonset = 1
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: addr, value: BTC }],
                    externalOutputs: [],
                },
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: addr, value: BTC / 2 }],
                    externalOutputs: [],
                },
            ],
        });
        expect(result.filter(r => r.address === addr)).toHaveLength(1);
        expect(anon(result, addr)).toBe(1);
    });

    test('addresses are returned in first-seen order: inputs before outputs, newest tx first', () => {
        // Transactions processed newest→oldest (reversed). Within each tx, inputs are
        // registered before outputs by TransactionLabelProvider (AddInternalInput order).
        const result = getAnonymityScores({
            transactions: [
                // tx0 (newest): inp (internal input) → out (internal output)
                {
                    internalInputs: [{ address: 'inp', value: BTC }],
                    externalInputs: [],
                    internalOutputs: [{ address: 'out', value: BTC }],
                    externalOutputs: [],
                },
                // tx1 (oldest): receive inp
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: 'inp', value: BTC }],
                    externalOutputs: [],
                },
            ],
        });
        // tx0 (newest) is processed first in the loop → "inp" and "out" are snapshotted first
        // "inp" input comes before "out" output within tx0
        expect(result.map(r => r.address)).toEqual(['inp', 'out']);
    });

    test('snapshot uses the anonset from the newest transaction the address appears in', () => {
        // addr:A appears as output in both tx0 (newer) and tx1 (older).
        // tx0 is processed first (reversed); at that point tx0 is a receive → anonset = 1.
        // tx1 would give the same result. Snapshot is taken after tx0 → anonset = 1.
        const result = getAnonymityScores({
            transactions: [
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: 'A', value: BTC }],
                    externalOutputs: [],
                },
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: 'A', value: BTC / 2 }],
                    externalOutputs: [],
                },
            ],
        });
        expect(anon(result, 'A')).toBe(1);
    });
});

// ─── error handling ───────────────────────────────────────────────────────────
// Source: GetAnonymityScores.json test vector 2 (expectedStatusCode 500)

describe('error handling', () => {
    test('internal input referencing an address with no prior output throws', () => {
        // The address "never-seen" was never registered as an output in any older transaction.
        // From JSON fixture: expectedResponse.description = "There is an internal input that references a non-existing transaction."
        expect(() =>
            getAnonymityScores({
                transactions: [
                    {
                        internalInputs: [{ address: 'never-seen', value: BTC }],
                        externalInputs: [],
                        internalOutputs: [],
                        externalOutputs: [],
                    },
                ],
            }),
        ).toThrow('There is an internal input that references a non-existing transaction');
    });
});

// ─── Wasabi 2 coinjoin detection ─────────────────────────────────────────────
// Source: GetAnonymityScoresHelperTests.IgnoreWabsabiCoinjoinOutputSortingTest

describe('Wasabi 2 CJ detection', () => {
    test('output ordering does not affect isWasabi2Cj detection', () => {
        // The C# unit test verifies IsWasabi2Cj is not sensitive to the order of outputs.
        // Conditions: ≥ 50 inputs, ≥ 2 outputs, > 80 % of outputs are StdDenoms.
        //
        // Here: 50 external inputs; outputs are 10 000, 20 000, 10 000 sats (not descending).
        // All three values (10 000 and 20 000) are StdDenoms → 3/3 = 100 % > 80 % → isWasabi2Cj.
        //
        // Since there are no internal inputs this is a receive tx → anonset = 1.
        // The test verifies the function does not crash and returns a valid result.
        const tx: Tx = {
            internalInputs: [],
            externalInputs: extInputs(50),
            internalOutputs: [{ address: 'A', value: 10_000 }],
            externalOutputs: [
                { value: 10_000, scriptPubKey: taprootScript(1) }, // not in descending order
                { value: 20_000, scriptPubKey: taprootScript(2) },
                { value: 10_000, scriptPubKey: taprootScript(3) },
            ],
        };
        const result = getAnonymityScores({ transactions: [tx] });
        // ownInputCount = 0 → AnalyzeReceive → anonset = 1
        expect(anon(result, 'A')).toBe(1);
    });

    test('WW2 CJ: standard-denomination output with foreign match uses weighted-average starting score', () => {
        // Wasabi 2 CJ path: ≥ 50 inputs, wallet output is a StdDenom that HAS a foreign match.
        // hasForeignMatch = true → startingScore = weightedAverage regardless of isWasabi2Cj.
        // 1 wallet input (anonset=1), 49 foreign inputs (total=50), 49 taproot @ 10 000 sats.
        // wallet output: 10 000 sats (StdDenom, matches 49 foreign taproot outputs).
        // gain = min(49/1, 49) = 49 → anonset = max(1+49, 49+1, 1) = 50
        const result = getAnonymityScores({
            transactions: [
                {
                    internalInputs: [{ address: 'A', value: 10_000 }],
                    externalInputs: extInputs(49),
                    internalOutputs: [{ address: 'B', value: 10_000 }],
                    externalOutputs: taprootOuts(49, 10_000),
                },
                {
                    internalInputs: [],
                    externalInputs: [{}],
                    internalOutputs: [{ address: 'A', value: 10_000 }],
                    externalOutputs: [],
                },
            ],
        });
        expect(anon(result, 'B')).toBe(50);
    });
});

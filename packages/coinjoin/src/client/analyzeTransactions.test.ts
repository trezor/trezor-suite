import { noopLogger } from '@trezor/logger';
import { address as addressBjs, script as bscript, networks } from '@trezor/utxo-lib';

import { analyzeTransactions, getAnonymityScores } from './analyzeTransactions';

/**
 * These used to stub the scorer through `mocks/server.ts`, which answered
 * `get-anonymity-scores` with a dummy "one point per occurrence" calculation. The scorer
 * now runs in process, so the assertions are the real anonymity scores.
 */

/**
 * A valid regtest P2TR address from an arbitrary 32-byte witness program. The program
 * does not have to be a curve point: nothing here spends these outputs.
 *
 * Taproot matters. `GetAnonymityScoresHelper` gives every internal output a taproot
 * script whatever the address actually is, and `ComputeAnonymityContribution` only counts
 * foreign outputs whose script type matches — so a P2WPKH round would score no gain at
 * all. Suite's coinjoin accounts are taproot.
 */
const addr = (i: number) =>
    addressBjs.fromOutputScript(bscript.compile([0x51, Buffer.alloc(32, i)]), networks.regtest);

const OWN_RECEIVE = addr(1);
const OWN_MIXED = addr(2);
const OWN_CHANGE = addr(3);
const FOREIGN = Array.from({ length: 9 }, (_, i) => addr(10 + i));

/** A simplified backend transaction. */
const generateTx = (vin: any[], vout: any[], type?: string) => {
    const mapVinVout = (v: any) => ({
        isAddress: typeof v.isAddress === 'boolean' ? v.isAddress : true,
        addresses: v.addresses ?? [v.address],
        value: v.value,
        isAccountOwned: v.isAccountOwned,
        hex: v.hex,
    });

    return {
        type,
        details: { vin: vin.map(mapVinVout), vout: vout.map(mapVinVout) },
    } as any;
};

/** The standard denomination the mixed output lands on. */
const DENOM = 20_000;

const receive = generateTx(
    [{ address: FOREIGN[0], value: 1_000_000 }],
    [{ address: OWN_RECEIVE, value: 1_000_000, isAccountOwned: true }],
);

const coinjoin = generateTx(
    [
        { address: OWN_RECEIVE, value: 1_000_000, isAccountOwned: true },
        ...FOREIGN.map(address => ({ address, value: 1_000_000 })),
    ],
    [
        { address: OWN_MIXED, value: DENOM, isAccountOwned: true },
        ...FOREIGN.map(address => ({ address, value: DENOM })),
        // not an address, so it is ignored by the transform
        {
            isAddress: false,
            value: 0,
            addresses: ['OP_RETURN (coinjoin)'],
            hex: '636f696e6a6f696e',
        },
    ],
    'joint',
);

const spend = generateTx(
    [{ address: OWN_MIXED, value: DENOM, isAccountOwned: true }],
    [
        { address: FOREIGN[1], value: 15_000 },
        { address: OWN_CHANGE, value: 4_000, isAccountOwned: true },
    ],
);

/** A standard denomination other than `DENOM`, for the older coinjoin below. */
const OLDER_DENOM = 500_000;

/**
 * A coinjoin whose own output is a standard denomination larger than every foreign one,
 * so that the clue differs depending on whether the own output reaches it.
 */
const coinjoinWithLargeOwnOutput = generateTx(
    [
        { address: OWN_RECEIVE, value: 1_000_000, isAccountOwned: true },
        ...FOREIGN.map(address => ({ address, value: 1_000_000 })),
    ],
    [
        { address: OWN_MIXED, value: OLDER_DENOM, isAccountOwned: true },
        ...FOREIGN.map(address => ({ address, value: DENOM })),
    ],
    'joint',
);

/**
 * `joint` only means that some input is foreign, so a collaborative transaction may still
 * send everything to the account's own addresses.
 */
const coinjoinToOwnAddressesOnly = generateTx(
    [
        { address: OWN_RECEIVE, value: 1_000_000, isAccountOwned: true },
        { address: FOREIGN[0], value: 1_000_000 },
    ],
    [{ address: OWN_MIXED, value: 1_000_000, isAccountOwned: true }],
    'joint',
);

/** An earlier coinjoin, on a different standard denomination than `coinjoin`. */
const olderCoinjoin = generateTx(
    [
        { address: OWN_RECEIVE, value: 1_000_000, isAccountOwned: true },
        ...FOREIGN.map(address => ({ address, value: 1_000_000 })),
    ],
    [
        { address: OWN_CHANGE, value: OLDER_DENOM, isAccountOwned: true },
        ...FOREIGN.map(address => ({ address, value: OLDER_DENOM })),
    ],
    'joint',
);

const options = { network: networks.regtest, logger: noopLogger };

describe('getAnonymityScores', () => {
    // Suite sends transactions newest first; the scorer folds them oldest first.
    it('scores a receive at one and a nine-peer coinjoin output at ten', () => {
        expect(getAnonymityScores([coinjoin, receive], options)).toEqual({
            [OWN_RECEIVE]: 1,
            [OWN_MIXED]: 10,
        });
    });

    it('reports each address once, at the score it had when it first appeared', () => {
        // Spending the mixed coin drops it to 1, but the reported score for that address
        // is the one it had right after the coinjoin that created it: the collection is
        // first-write-wins.
        expect(getAnonymityScores([spend, coinjoin, receive], options)).toEqual({
            [OWN_MIXED]: 10,
            [OWN_CHANGE]: 1,
            [OWN_RECEIVE]: 1,
        });
    });

    it('returns no scores for an empty history', () => {
        expect(getAnonymityScores([], options)).toEqual({});
    });

    it('logs and returns undefined when the history is not self-consistent', () => {
        const logger = { ...noopLogger, error: jest.fn() };
        // The oldest transaction spends an address that no earlier transaction created.
        const result = getAnonymityScores([coinjoin], { ...options, logger });

        expect(result).toBeUndefined();
        expect(logger.error).toHaveBeenCalledWith(
            expect.stringContaining('references a non-existing transaction'),
        );
    });
});

describe('analyzeTransactions', () => {
    it('derives both the scores and the raw liquidity clue', () => {
        expect(analyzeTransactions([coinjoin, receive], options)).toEqual({
            anonymityScores: {
                [OWN_RECEIVE]: 1,
                [OWN_MIXED]: 10,
            },
            // The nine foreign outputs are all on the same standard denomination, so the
            // top 10% of the distinct denominations is that one value.
            rawLiquidityClue: DENOM,
        });
    });

    it('has no liquidity clue without a coinjoin in the history', () => {
        expect(analyzeTransactions([receive], options).rawLiquidityClue).toBeNull();
    });

    it("derives the clue only from the other participants' outputs", () => {
        // Only the foreign outputs describe the others' liquidity. The own 500000 output is
        // a standard denomination too and would win the top 10% if it ever reached the clue.
        expect(analyzeTransactions([coinjoinWithLargeOwnOutput], options).rawLiquidityClue).toBe(
            DENOM,
        );
    });

    it('has no liquidity clue from a coinjoin paying only to own addresses', () => {
        // Nothing foreign means nothing to infer, even though the own output is itself a
        // standard denomination.
        expect(analyzeTransactions([coinjoinToOwnAddressesOnly], options).rawLiquidityClue).toBe(
            null,
        );
    });

    it('derives the clue from the most recent coinjoin only', () => {
        // Suite sends transactions newest first, so the older coinjoin's denomination must
        // not contribute.
        expect(
            analyzeTransactions([coinjoin, olderCoinjoin, receive], options).rawLiquidityClue,
        ).toBe(DENOM);
        expect(
            analyzeTransactions([olderCoinjoin, coinjoin, receive], options).rawLiquidityClue,
        ).toBe(OLDER_DENOM);
    });

    it('computes only the requested sections', () => {
        expect(analyzeTransactions([coinjoin, receive], options, ['rawLiquidityClue'])).toEqual({
            anonymityScores: undefined,
            rawLiquidityClue: DENOM,
        });
        expect(analyzeTransactions([coinjoin, receive], options, ['anonymityScores'])).toEqual({
            anonymityScores: { [OWN_RECEIVE]: 1, [OWN_MIXED]: 10 },
            rawLiquidityClue: undefined,
        });
    });
});

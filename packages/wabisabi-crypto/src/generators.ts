import { secp256k1 } from '@noble/curves/secp256k1.js';

import { GroupElement, groupElementFromText, precomputeGenerator } from './groupElement';
import { type Scalar, scalarFromNumber, scalarNegate, scalarPowerOfTwo } from './scalar';

/**
 * Port of `NWabiSabi/WabiSabi/Crypto/Groups/Generators.cs`.
 *
 * Each generator is derived at load time by the same iterated-SHA256 lift upstream
 * uses, then asserted against the constants in
 * `NWabiSabi/WabiSabi.Tests/Crypto/GroupElements/GeneratorTests.cs`. Deriving rather
 * than transcribing means a transcription error cannot survive, and asserting means a
 * derivation error cannot either.
 */

/**
 * Window widths for the precomputed tables. See `precomputeGenerator`.
 *
 * The ten base generators carry essentially every multiplication in a range proof, so
 * they get the wide table. The negated powers of two appear once each per proof, so they
 * get the narrow one and are built lazily — a width-42 proof only ever touches 42 of the
 * 255.
 */
const BASE_GENERATOR_WINDOW = 8;
const POWER_OF_TWO_WINDOW = 5;

/** Base point defined in the secp256k1 standard used in ECDSA public key derivation. */
export const G = GroupElement.fromPoint(secp256k1.Point.BASE);

/** Generator point for MAC and Show. */
export const Gw = groupElementFromText('Gw');

/** Generator point for MAC and Show. */
export const Gwp = groupElementFromText('Gwp');

/** Generator point for MAC and Show. */
export const Gx0 = groupElementFromText('Gx0');

/** Generator point for MAC and Show. */
export const Gx1 = groupElementFromText('Gx1');

/** Generator point for MAC and Show. */
export const GV = groupElementFromText('GV');

/** Generator point for Pedersen commitments. */
export const Gg = groupElementFromText('Gg');

/** Generator point for Pedersen commitments. */
export const Gh = groupElementFromText('Gh');

/** Generator point for attributes M_{ai}. */
export const Ga = groupElementFromText('Ga');

/** Generator point for serial numbers. */
export const Gs = groupElementFromText('Gs');

/** The expected hex of every generator, from upstream `GeneratorTests.GeneratorsArentChanged`. */
export const GENERATOR_HEX = {
    G: '0279BE667EF9DCBBAC55A06295CE870B07029BFCDB2DCE28D959F2815B16F81798',
    Ga: '03AB8F46084B4FA0FC8261328A5A71AF267B1D1F8FE229C63C751D02A2E996E0EC',
    Gg: '02FB8868ACD9CBBD68964BAA1CFA6B893A6269E01569183474E6C1C4242A0071A9',
    Gh: '023D11E10CE7A8C17671ED777886FC2B84E65A532FA0C411ABBE96E1206F9DFF80',
    Gs: '031E7775ED62B79E9E83366198CFE69DFE7408AFF10C331CEE3B2C7F7A5F2EB0C8',
    GV: '03665E9B8468DCEDA16ED3E315FBD0A0E597F4AA3B4C6F2146437F53F3AF204C2C',
    Gw: '02B4DF49B623A8A0B245CCF2867134A5DAC12FE39ECEC08B3D361801D2C79DDC14',
    Gwp: '03F50265578FCE5E977162E662ED75D7224AE720FA79B72CF2B6FB86B2136E3B48',
    Gx0: '02E33C9F3CBE6388A2D3C3ECB12153DB73499928541905D86AAA4FFC01F2763B54',
    Gx1: '0246253CC926AAB789BAA278AB9A54EDEF455CA2014038E9F84DE312C05A8121CC',
} as const;

const DERIVED: Record<keyof typeof GENERATOR_HEX, GroupElement> = {
    G,
    Ga,
    Gg,
    Gh,
    Gs,
    GV,
    Gw,
    Gwp,
    Gx0,
    Gx1,
};

// A wrong generator is a silently invalid proof, so fail at import rather than at
// registration time.
Object.entries(GENERATOR_HEX).forEach(([name, hex]) => {
    const derived = DERIVED[name as keyof typeof GENERATOR_HEX].toHex();
    if (derived !== hex) {
        throw new Error(`Generator ${name} derived as ${derived}, expected ${hex}.`);
    }
});

Object.values(DERIVED).forEach(generator => precomputeGenerator(generator, BASE_GENERATOR_WINDOW));

/** Scalars corresponding to `2^i`, used in range proofs. */
export const ScalarPowersOfTwo: readonly Scalar[] = Array.from({ length: 255 }, (_, i) =>
    scalarPowerOfTwo(i),
);

/** Generators corresponding to `-(2^i) * Gh`, used in range proofs. */
export const NegatedGhPowersOfTwo: readonly GroupElement[] = ScalarPowersOfTwo.map(power =>
    precomputeGenerator(Gh.multiply(scalarNegate(power)), POWER_OF_TWO_WINDOW),
);

/**
 * `-Gh`, the `rb_i` coefficient of every bit-squared row of a range proof statement.
 *
 * Hoisted out of `rangeProofStatement` so that it is one precomputed generator rather
 * than a fresh point on every call; upstream computes it once per statement too.
 */
export const NegatedGh: GroupElement = precomputeGenerator(Gh.negate(), BASE_GENERATOR_WINDOW);

/**
 * The width a mainnet amount credential's range proof uses,
 * `ceil(log2(MaxAmountCredentialValue))` for the 43 000 BTC upper bound every round has
 * carried so far. Only `warmUp` reads it, and only to decide how many of the
 * powers-of-two tables to build ahead.
 */
export const MAINNET_RANGE_PROOF_WIDTH = 42;

/**
 * Builds the precomputed tables up front, handing the event loop back between them.
 *
 * The tables are lazy, so without this the first credential request of a process pays
 * for all of them: measured at 380 ms in one uninterrupted stretch, which is exactly
 * what the budget for a single synchronous computation is about. Most of it is the
 * powers-of-two tables, one per bit of the range proof. Called from
 * `CoinjoinClient.enable()`, which is before a round rather than inside one; a width
 * wider than asked for here still works, its remaining tables are just built lazily as
 * upstream's are.
 */
export const warmUp = async (
    yieldToCaller: () => Promise<void>,
    rangeProofWidth = MAINNET_RANGE_PROOF_WIDTH,
) => {
    // Doing one multiplication is what builds the table, and `@noble/curves` keeps a
    // separate one for the constant-time and the variable-time path, so the base
    // generators — which are multiplied both ways — are touched twice. Multiplying by
    // three rather than one or zero matters: those two have short circuits in front of
    // the table.
    const three = scalarFromNumber(3);
    for (const generator of [...Object.values(DERIVED), NegatedGh]) {
        generator.multiply(three);
        await yieldToCaller();
        generator.multiplyUnsafe(three);
        await yieldToCaller();
    }
    // The powers of two are only ever reached through a multi-scalar multiplication,
    // which is variable time.
    for (let i = 0; i < Math.min(rangeProofWidth, NegatedGhPowersOfTwo.length); i++) {
        (NegatedGhPowersOfTwo[i] as GroupElement).multiplyUnsafe(three);
        await yieldToCaller();
    }
};

const FRIENDLY_NAMES: [GroupElement, string][] = [
    [G, 'Standard'],
    [Gw, 'Gw'],
    [Gwp, 'Gwp'],
    [Gx0, 'Gx0'],
    [Gx1, 'Gx1'],
    [GV, 'GV'],
    [Gg, 'Gg'],
    [Gh, 'Gh'],
    [Ga, 'Ga'],
    [Gs, 'Gs'],
];

/** `Generators.TryGetFriendlyGeneratorName` — debugging aid only. */
export const tryGetFriendlyGeneratorName = (element: GroupElement | null | undefined) => {
    if (element === null || element === undefined) {
        return undefined;
    }
    const match = FRIENDLY_NAMES.find(([generator]) => generator.equals(element));

    return match === undefined ? undefined : `${match[1]} Generator`;
};

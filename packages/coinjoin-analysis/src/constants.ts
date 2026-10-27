/**
 * Standard WabiSabi denominations, in satoshi.
 *
 * Ported verbatim from `BlockchainAnalyzer.StdDenoms`.
 */
export const STD_DENOMS = [
    5000, 6561, 8192, 10000, 13122, 16384, 19683, 20000, 32768, 39366, 50000, 59049, 65536, 100000,
    118098, 131072, 177147, 200000, 262144, 354294, 500000, 524288, 531441, 1000000, 1048576,
    1062882, 1594323, 2000000, 2097152, 3188646, 4194304, 4782969, 5000000, 8388608, 9565938,
    10000000, 14348907, 16777216, 20000000, 28697814, 33554432, 43046721, 50000000, 67108864,
    86093442, 100000000, 129140163, 134217728, 200000000, 258280326, 268435456, 387420489,
    500000000, 536870912, 774840978, 1000000000, 1073741824, 1162261467, 2000000000, 2147483648,
    2324522934, 3486784401, 4294967296, 5000000000, 6973568802, 8589934592, 10000000000,
    10460353203, 17179869184, 20000000000, 20920706406, 31381059609, 34359738368, 50000000000,
    62762119218, 68719476736, 94143178827, 100000000000, 137438953472,
] as const;

const STD_DENOMS_SET = new Set<number>(STD_DENOMS);

/**
 * `BlockchainAnalyzer.StdDenoms.Contains(satoshi)`, as a constant-time lookup.
 */
export const isStdDenom = (satoshi: number) => STD_DENOMS_SET.has(satoshi);

/**
 * `Constants.MaximumNumberOfSatoshis`, which upstream also reaches through
 * `Constants.MaximumNumberOfBitcoinsMoney` (the same amount expressed in BTC).
 */
export const MAXIMUM_NUMBER_OF_SATOSHIS = 2099999997690000;

// Anonymity scoring is not ported yet, so the two constants below have no consumer in this package
// and are not re-exported from `index.ts`.

/**
 * `HdPubKey.DefaultHighAnonymitySet`, which upstream defines as `int.MaxValue`. It marks an address
 * whose anonymity set has never been assigned, so it must stay exactly this value rather than become
 * a sentinel of our own: the coinjoin output branch compares against it.
 */
export const DEFAULT_HIGH_ANONYMITY_SET = 2147483647;

/**
 * `CoinjoinAnalyzer.MaxRecursionDepth`.
 */
export const MAX_RECURSION_DEPTH = 3;

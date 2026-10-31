/**
 * `BlockchainAnalyzer.StdDenoms` — the standard coinjoin denominations, in satoshis.
 *
 * Seventy-nine entries: powers of two, powers of three, powers of three doubled, and the
 * 1-2-5 decimal series, between 5000 satoshis and about 1374 BTC.
 *
 * Both the anonymity scorer and the liquidity clue key off membership in this table: the
 * scorer to decide whether a WabiSabi 2 output is a denomination rather than change, the
 * liquidity clue because only denomination outputs can be considered reasonably mixed.
 */
export const STD_DENOMS: readonly number[] = [
    5000, 6561, 8192, 10000, 13122, 16384, 19683, 20000, 32768, 39366, 50000, 59049, 65536, 100000,
    118098, 131072, 177147, 200000, 262144, 354294, 500000, 524288, 531441, 1000000, 1048576,
    1062882, 1594323, 2000000, 2097152, 3188646, 4194304, 4782969, 5000000, 8388608, 9565938,
    10000000, 14348907, 16777216, 20000000, 28697814, 33554432, 43046721, 50000000, 67108864,
    86093442, 100000000, 129140163, 134217728, 200000000, 258280326, 268435456, 387420489,
    500000000, 536870912, 774840978, 1000000000, 1073741824, 1162261467, 2000000000, 2147483648,
    2324522934, 3486784401, 4294967296, 5000000000, 6973568802, 8589934592, 10000000000,
    10460353203, 17179869184, 20000000000, 20920706406, 31381059609, 34359738368, 50000000000,
    62762119218, 68719476736, 94143178827, 100000000000, 137438953472,
];

const STD_DENOM_SET = new Set(STD_DENOMS);

export const isStdDenom = (satoshis: number) => STD_DENOM_SET.has(satoshis);

/**
 * `Constants.MaximumNumberOfBitcoinsMoney` — `Money.Coins(20999999.9769m)`, i.e.
 * `Constants.MaximumNumberOfSatoshis`.
 */
export const MAXIMUM_NUMBER_OF_SATOSHIS = 2_099_999_997_690_000;

/** `Constants.SemiPrivateThreshold`. */
export const SEMI_PRIVATE_THRESHOLD = 2;

/** `HdPubKey.DefaultHighAnonymitySet` — `int.MaxValue`. */
export const DEFAULT_HIGH_ANONYMITY_SET = 2_147_483_647;

/** `CoinjoinAnalyzer.MaxRecursionDepth`. */
export const MAX_RECURSION_DEPTH = 3;

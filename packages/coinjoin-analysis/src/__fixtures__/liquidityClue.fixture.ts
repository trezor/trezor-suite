// Captured from the bundled WalletWasabi.WabiSabiClientLibrary binary. Upstream ships neither
// vectors nor unit tests for the liquidity clue, so every case here is a recorded request/response
// pair rather than a transcription. Do not hand-edit the recorded responses.
//
// Captured against get-version: {"Version":"15.0","CommitHash":"34a0f983a527cff36f20c19ad9b0650a02238e38","Debug":false}

import { type RawLiquidityClue } from '../types';

export const LIQUIDITY_CLUE_BINARY_VERSION = {
    Version: '15.0',
    CommitHash: '34a0f983a527cff36f20c19ad9b0650a02238e38',
    Debug: false,
};

type InitLiquidityClueFixture = {
    description: string;
    request: { ExternalAmounts: number[] };
    response: { RawLiquidityClue: RawLiquidityClue };
};

type UpdateLiquidityClueFixture = {
    description: string;
    request: {
        RawLiquidityClue: RawLiquidityClue;
        MaxSuggestedAmount: number;
        ExternalAmounts: number[];
    };
    response: { RawLiquidityClue: RawLiquidityClue };
};

type GetLiquidityClueFixture = {
    description: string;
    request: { RawLiquidityClue: RawLiquidityClue; MaxSuggestedAmount: number };
    response: { LiquidityClue: number };
};

export const initLiquidityClueFixtures: InitLiquidityClueFixture[] = [
    {
        description: 'no outputs at all',
        request: { ExternalAmounts: [] },
        response: { RawLiquidityClue: null },
    },
    {
        description: 'no standard denomination among the outputs',
        request: { ExternalAmounts: [1234, 5678] },
        response: { RawLiquidityClue: null },
    },
    {
        description: 'zero-valued outputs are not denominations',
        request: { ExternalAmounts: [0, 0, 5000] },
        response: { RawLiquidityClue: 5000 },
    },
    {
        description: 'a single denomination',
        request: { ExternalAmounts: [5000] },
        response: { RawLiquidityClue: 5000 },
    },
    {
        description: 'equal denominations collapse to one',
        request: { ExternalAmounts: [20000, 20000, 20000] },
        response: { RawLiquidityClue: 20000 },
    },
    {
        description: 'non-denominations dropped, top 10% of 3 distinct is 1',
        request: { ExternalAmounts: [5000, 5000, 10000, 20000, 1234] },
        response: { RawLiquidityClue: 20000 },
    },
    {
        description: '10 distinct denominations, top 10% is 1',
        request: {
            ExternalAmounts: [5000, 6561, 8192, 10000, 13122, 16384, 19683, 20000, 32768, 39366],
        },
        response: { RawLiquidityClue: 39366 },
    },
    {
        description: '12 distinct denominations, mean of the top 2 truncates',
        request: {
            ExternalAmounts: [
                5000, 6561, 8192, 10000, 13122, 16384, 19683, 20000, 32768, 39366, 50000, 59049,
            ],
        },
        response: { RawLiquidityClue: 54524 },
    },
    {
        description: '22 distinct denominations, mean of the top 3 truncates',
        request: {
            ExternalAmounts: [
                5000, 6561, 8192, 10000, 13122, 16384, 19683, 20000, 32768, 39366, 50000, 59049,
                65536, 100000, 118098, 131072, 177147, 200000, 262144, 354294, 500000, 524288,
            ],
        },
        response: { RawLiquidityClue: 459527 },
    },
    {
        description: 'every standard denomination, top 10% is 8',
        request: {
            ExternalAmounts: [
                5000, 6561, 8192, 10000, 13122, 16384, 19683, 20000, 32768, 39366, 50000, 59049,
                65536, 100000, 118098, 131072, 177147, 200000, 262144, 354294, 500000, 524288,
                531441, 1000000, 1048576, 1062882, 1594323, 2000000, 2097152, 3188646, 4194304,
                4782969, 5000000, 8388608, 9565938, 10000000, 14348907, 16777216, 20000000,
                28697814, 33554432, 43046721, 50000000, 67108864, 86093442, 100000000, 129140163,
                134217728, 200000000, 258280326, 268435456, 387420489, 500000000, 536870912,
                774840978, 1000000000, 1073741824, 1162261467, 2000000000, 2147483648, 2324522934,
                3486784401, 4294967296, 5000000000, 6973568802, 8589934592, 10000000000,
                10460353203, 17179869184, 20000000000, 20920706406, 31381059609, 34359738368,
                50000000000, 62762119218, 68719476736, 94143178827, 100000000000, 137438953472,
            ],
        },
        response: { RawLiquidityClue: 72350565778 },
    },
    {
        description: 'coinjoin-shaped foreign outputs',
        request: {
            ExternalAmounts: [
                5000000, 5000000, 5000000, 1000000, 1000000, 1000000, 1000000, 500000, 500000,
                200000, 200000, 200000, 100000, 65536, 50000, 20000, 20000, 10000, 5000, 5000,
                1234567,
            ],
        },
        response: { RawLiquidityClue: 5000000 },
    },
];

export const updateLiquidityClueFixtures: UpdateLiquidityClueFixture[] = [
    {
        description: 'normal round lowers the clue',
        request: {
            RawLiquidityClue: 50000,
            MaxSuggestedAmount: 1000000,
            ExternalAmounts: [20000, 20000, 10000],
        },
        response: { RawLiquidityClue: 20000 },
    },
    {
        description: 'normal round raises the clue',
        request: {
            RawLiquidityClue: 5000,
            MaxSuggestedAmount: 100000000,
            ExternalAmounts: [
                5000000, 5000000, 5000000, 1000000, 1000000, 1000000, 1000000, 500000, 500000,
                200000, 200000, 200000, 100000, 65536, 50000, 20000, 20000, 10000, 5000, 5000,
                1234567,
            ],
        },
        response: { RawLiquidityClue: 5000000 },
    },
    {
        description: 'first round sets the clue from nothing',
        request: {
            RawLiquidityClue: null,
            MaxSuggestedAmount: 1000000,
            ExternalAmounts: [20000, 10000],
        },
        response: { RawLiquidityClue: 20000 },
    },
    {
        description: 'pleb round is dismissed, the clue is kept',
        request: { RawLiquidityClue: 5000, MaxSuggestedAmount: 20000, ExternalAmounts: [20000] },
        response: { RawLiquidityClue: 5000 },
    },
    {
        description: 'pleb round is dismissed with no clue to fall back to',
        request: { RawLiquidityClue: null, MaxSuggestedAmount: 20000, ExternalAmounts: [20000] },
        response: { RawLiquidityClue: null },
    },
    {
        description: 'the clue at exactly half the maximum is still a pleb round',
        request: { RawLiquidityClue: 5000, MaxSuggestedAmount: 40000, ExternalAmounts: [20000] },
        response: { RawLiquidityClue: 5000 },
    },
    {
        description: 'halving the maximum truncates, so this is still a pleb round',
        request: { RawLiquidityClue: 5000, MaxSuggestedAmount: 40001, ExternalAmounts: [20000] },
        response: { RawLiquidityClue: 5000 },
    },
    {
        description: 'one satoshi past the truncated half, the round counts',
        request: { RawLiquidityClue: 5000, MaxSuggestedAmount: 40002, ExternalAmounts: [20000] },
        response: { RawLiquidityClue: 20000 },
    },
    {
        description: 'a round without denominations keeps the clue',
        request: {
            RawLiquidityClue: 20000,
            MaxSuggestedAmount: 1000000,
            ExternalAmounts: [1234, 5678],
        },
        response: { RawLiquidityClue: 20000 },
    },
];

export const getLiquidityClueFixtures: GetLiquidityClueFixture[] = [
    {
        description: 'no clue yet, so the maximum suggested amount is the only limit',
        request: { RawLiquidityClue: null, MaxSuggestedAmount: 1000000 },
        response: { LiquidityClue: 1000000 },
    },
    {
        description: 'no clue and no meaningful maximum either',
        request: { RawLiquidityClue: null, MaxSuggestedAmount: 2099999997690000 },
        response: { LiquidityClue: 2099999997690000 },
    },
    {
        description: 'the clue is below the maximum suggested amount',
        request: { RawLiquidityClue: 20000, MaxSuggestedAmount: 1000000 },
        response: { LiquidityClue: 20000 },
    },
    {
        description: 'the clue is capped at the maximum suggested amount',
        request: { RawLiquidityClue: 1000000, MaxSuggestedAmount: 20000 },
        response: { LiquidityClue: 20000 },
    },
    {
        description: 'the clue sits exactly at the maximum suggested amount',
        request: { RawLiquidityClue: 20000, MaxSuggestedAmount: 20000 },
        response: { LiquidityClue: 20000 },
    },
];

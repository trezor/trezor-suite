import {
    type GraphFiatCoinEntry,
    type GraphFiatResolution,
    type GraphFiatResolutionEntry,
} from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';

export const getGraphFiatEntryKey = ({
    baseCurrencyCode,
    coinId,
}: {
    baseCurrencyCode: BaseCurrencyCode;
    coinId: string;
}) => `${coinId}:${baseCurrencyCode}`;

export const createEmptyGraphFiatResolutionEntry = (): GraphFiatResolutionEntry => ({
    points: [],
    fetchedAt: null,
    lastPointTimestamp: null,
    isLoading: false,
    error: null,
});

export const createEmptyGraphFiatCoinEntry = (
    baseCurrencyCode: BaseCurrencyCode,
): GraphFiatCoinEntry => ({
    currency: baseCurrencyCode,
    resolutions: {
        day: createEmptyGraphFiatResolutionEntry(),
        month: createEmptyGraphFiatResolutionEntry(),
        max: createEmptyGraphFiatResolutionEntry(),
    },
});

const emptyGraphFiatCoinEntries = new Map<BaseCurrencyCode, GraphFiatCoinEntry>();

export const getEmptyGraphFiatCoinEntry = (
    baseCurrencyCode: BaseCurrencyCode,
): GraphFiatCoinEntry => {
    const existingEntry = emptyGraphFiatCoinEntries.get(baseCurrencyCode);

    if (existingEntry) {
        return existingEntry;
    }

    const nextEntry = createEmptyGraphFiatCoinEntry(baseCurrencyCode);
    emptyGraphFiatCoinEntries.set(baseCurrencyCode, nextEntry);

    return nextEntry;
};

export const keepOnlyGraphFiatResolution = ({
    coinEntry,
    resolution,
}: {
    coinEntry: GraphFiatCoinEntry;
    resolution: GraphFiatResolution;
}): GraphFiatCoinEntry => {
    const nextCoinEntry = createEmptyGraphFiatCoinEntry(coinEntry.currency);

    nextCoinEntry.resolutions[resolution] = coinEntry.resolutions[resolution];

    return nextCoinEntry;
};

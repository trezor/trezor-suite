import { createReducer } from '@reduxjs/toolkit';

import { type GraphFiatCoinEntry, type GraphFiatResolution } from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';

import {
    hydrateGraphFiatEntriesFromStorage,
    refreshGraphFiatResolution,
    removeGraphFiatEntriesFromMemory,
    removeGraphFiatResolutionsFromMemory,
} from '../../actions/wallet/graphFiatActions';
import {
    createEmptyGraphFiatCoinEntry,
    createEmptyGraphFiatResolutionEntry,
    getGraphFiatEntryKey,
} from '../../support/wallet/graphFiatUtils';

export type GraphFiatState = Record<string, GraphFiatCoinEntry>;

const getCoinEntry = (
    state: GraphFiatState,
    coinId: string,
    baseCurrencyCode: BaseCurrencyCode,
) => {
    const entryKey = getGraphFiatEntryKey({ baseCurrencyCode, coinId });

    if (!state[entryKey]) {
        state[entryKey] = createEmptyGraphFiatCoinEntry(baseCurrencyCode);
    }

    return state[entryKey];
};

const getResolutionEntry = (
    state: GraphFiatState,
    baseCurrencyCode: BaseCurrencyCode,
    coinId: string,
    resolution: GraphFiatResolution,
) => getCoinEntry(state, coinId, baseCurrencyCode).resolutions[resolution];

const initialState: GraphFiatState = {};

export const graphFiatReducer = createReducer(initialState, builder => {
    builder
        .addCase(refreshGraphFiatResolution.pending, (state, action) => {
            const { baseCurrencyCode, coinId, resolution } = action.meta.arg;
            const resolutionEntry = getResolutionEntry(state, baseCurrencyCode, coinId, resolution);

            resolutionEntry.isLoading = true;
            resolutionEntry.error = null;
        })
        .addCase(refreshGraphFiatResolution.fulfilled, (state, action) => {
            const { baseCurrencyCode, coinId, resolution, points, fetchedAt } = action.payload;
            const resolutionEntry = getResolutionEntry(state, baseCurrencyCode, coinId, resolution);

            resolutionEntry.points = points;
            resolutionEntry.fetchedAt = fetchedAt;
            resolutionEntry.lastPointTimestamp = resolutionEntry.points.at(-1)?.time ?? null;
            resolutionEntry.isLoading = false;
            resolutionEntry.error = null;
        })
        .addCase(refreshGraphFiatResolution.rejected, (state, action) => {
            const { baseCurrencyCode, coinId, resolution } = action.meta.arg;
            const resolutionEntry = getResolutionEntry(state, baseCurrencyCode, coinId, resolution);

            resolutionEntry.isLoading = false;
            resolutionEntry.error = action.error.message ?? 'Failed to refresh graph fiat history.';
        })
        .addCase(removeGraphFiatEntriesFromMemory, (state, action) => {
            action.payload.keys.forEach(key => {
                delete state[key];
            });
        })
        .addCase(removeGraphFiatResolutionsFromMemory, (state, action) => {
            action.payload.entries.forEach(({ baseCurrencyCode, coinId, resolution }) => {
                getCoinEntry(state, coinId, baseCurrencyCode).resolutions[resolution] =
                    createEmptyGraphFiatResolutionEntry();
            });
        })
        .addCase(hydrateGraphFiatEntriesFromStorage, (state, action) => {
            action.payload.entries.forEach(({ key, value }) => {
                if (!state[key]) {
                    state[key] = value;

                    return;
                }

                (Object.keys(value.resolutions) as GraphFiatResolution[]).forEach(resolution => {
                    const currentResolutionEntry = state[key].resolutions[resolution];
                    const persistedResolutionEntry = value.resolutions[resolution];

                    if (currentResolutionEntry.points.length === 0) {
                        state[key].resolutions[resolution] = persistedResolutionEntry;
                    }
                });
            });
        });
});

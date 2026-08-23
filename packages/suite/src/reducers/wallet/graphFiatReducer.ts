import { createReducer } from '@reduxjs/toolkit';

import { setBaseCurrency } from '@suite-common/wallet-core';
import {
    type GraphFiatResolution,
    type GraphFiatResolutionEntry,
} from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';

import {
    hydrateGraphFiatEntriesFromStorage,
    refreshGraphFiatResolution,
    removeGraphFiatResolutionsFromMemory,
} from '../../actions/wallet/graphFiatActions';
import {
    createEmptyGraphFiatResolutionEntry,
    getGraphFiatEntryKey,
    isGraphFiatEntryForBaseCurrency,
} from '../../support/wallet/graphFiatUtils';

export type GraphFiatState = Record<string, GraphFiatResolutionEntry>;

const getResolutionEntry = (
    state: GraphFiatState,
    baseCurrencyCode: BaseCurrencyCode,
    coinId: string,
    resolution: GraphFiatResolution,
) => {
    const entryKey = getGraphFiatEntryKey({ baseCurrencyCode, coinId, resolution });

    if (!state[entryKey]) {
        state[entryKey] = createEmptyGraphFiatResolutionEntry();
    }

    return state[entryKey];
};

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
            resolutionEntry.failedAt = null;
            resolutionEntry.lastPointTimestamp = points.at(-1)?.time ?? null;
            resolutionEntry.isLoading = false;
            resolutionEntry.error = null;
        })
        .addCase(refreshGraphFiatResolution.rejected, (state, action) => {
            const { baseCurrencyCode, coinId, resolution } = action.meta.arg;
            const resolutionEntry = getResolutionEntry(state, baseCurrencyCode, coinId, resolution);

            resolutionEntry.isLoading = false;
            resolutionEntry.failedAt = action.payload?.failedAt ?? null;
            resolutionEntry.error =
                action.payload?.message ??
                action.error.message ??
                'Failed to refresh graph fiat history.';
        })
        .addCase(setBaseCurrency, (state, action) => {
            Object.keys(state).forEach(key => {
                if (!isGraphFiatEntryForBaseCurrency(key, action.payload.localCurrency)) {
                    delete state[key];
                }
            });
        })
        .addCase(removeGraphFiatResolutionsFromMemory, (state, action) => {
            action.payload.entries.forEach(({ baseCurrencyCode, coinId, resolution }) => {
                delete state[getGraphFiatEntryKey({ baseCurrencyCode, coinId, resolution })];
            });
        })
        .addCase(hydrateGraphFiatEntriesFromStorage, (state, action) => {
            action.payload.entries.forEach(({ key, value }) => {
                const currentEntry = state[key];

                if (!currentEntry || currentEntry.points.length === 0) {
                    state[key] = value;
                }
            });
        });
});

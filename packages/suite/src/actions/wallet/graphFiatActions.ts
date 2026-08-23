import { createAction, createSelector } from '@reduxjs/toolkit';

import {
    canRetryGraphHistoricFiatRates,
    fetchGraphHistoricFiatRates,
    getGraphFiatFetchTimestamp,
    isGraphHistoricResolutionCoverageStale,
    isGraphHistoricResolutionStale,
} from '@suite-common/fiat-services';
import { createThunk } from '@suite-common/redux-utils';
import {
    type GraphFiatPoint,
    type GraphFiatResolution,
    type GraphFiatResolutionEntry,
    type Timestamp,
} from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { loadGraphFiatEntriesFromStorage } from 'src/support/wallet/graphFiatStorage';
import {
    getEmptyGraphFiatResolutionEntry,
    getGraphFiatEntryKey,
} from 'src/support/wallet/graphFiatUtils';
import { type AppState, type Dispatch } from 'src/types/suite';

// Tracks in-flight `refreshGraphFiatResolution` dispatches so that two callers
// firing `ensureGraphFiatRates` synchronously for the same (coin, resolution,
// currency) don't both reach `dispatch(refreshGraphFiatResolution(...))`
// before the first one's `pending` action sets `isLoading: true` in the
// reducer. Keyed `${coinId}:${baseCurrencyCode}:${resolution}`.
const inFlightGraphFiatRefreshes = new Map<string, Promise<unknown>>();

type RefreshGraphFiatResolutionArgs = {
    baseCurrencyCode: BaseCurrencyCode;
    coinId: string;
    resolution: GraphFiatResolution;
};

type RefreshGraphFiatResolutionResult = RefreshGraphFiatResolutionArgs & {
    fetchedAt: Timestamp;
    points: GraphFiatPoint[];
};

type RefreshGraphFiatResolutionError = {
    failedAt: Timestamp;
    message: string;
};

export const refreshGraphFiatResolution = createThunk<
    RefreshGraphFiatResolutionResult,
    RefreshGraphFiatResolutionArgs,
    { rejectValue: RefreshGraphFiatResolutionError }
>(
    'wallet/graphFiat/refreshGraphFiatResolution',
    async ({ baseCurrencyCode, coinId, resolution }, { rejectWithValue }) => {
        try {
            const points = await fetchGraphHistoricFiatRates({
                baseCurrencyCode,
                coinId,
                resolution,
            });

            return {
                baseCurrencyCode,
                coinId,
                fetchedAt: getGraphFiatFetchTimestamp(),
                points,
                resolution,
            };
        } catch (error) {
            return rejectWithValue({
                failedAt: getGraphFiatFetchTimestamp(),
                message: error instanceof Error ? error.message : String(error),
            });
        }
    },
);

export const removeGraphFiatResolutionsFromMemory = createAction(
    'wallet/graphFiat/removeGraphFiatResolutionsFromMemory',
    (
        entries: {
            baseCurrencyCode: BaseCurrencyCode;
            coinId: string;
            resolution: GraphFiatResolution;
        }[],
    ) => ({
        payload: { entries },
    }),
);

export const hydrateGraphFiatEntriesFromStorage = createAction(
    'wallet/graphFiat/hydrateGraphFiatEntriesFromStorage',
    (entries: { key: string; value: GraphFiatResolutionEntry }[]) => ({
        payload: { entries },
    }),
);

export type GraphFiatAction =
    | ReturnType<typeof hydrateGraphFiatEntriesFromStorage>
    | ReturnType<typeof removeGraphFiatResolutionsFromMemory>;

const selectGraphFiatState = (state: AppState) => state.wallet.graphFiat;

export const selectGraphFiatResolutionEntry = (
    state: AppState,
    coinId: string,
    baseCurrencyCode: BaseCurrencyCode,
    resolution: GraphFiatResolution,
) =>
    selectGraphFiatState(state)[getGraphFiatEntryKey({ baseCurrencyCode, coinId, resolution })] ??
    getEmptyGraphFiatResolutionEntry();

export const shouldRefreshGraphFiatResolution = (
    resolutionEntry: GraphFiatResolutionEntry,
    requiredResolution: GraphFiatResolution,
): boolean => {
    if (resolutionEntry.isLoading) {
        return false;
    }

    if (!canRetryGraphHistoricFiatRates(resolutionEntry.failedAt ?? null)) {
        return false;
    }

    if (resolutionEntry.points.length === 0) {
        return true;
    }

    if (
        requiredResolution === 'day' &&
        isGraphHistoricResolutionCoverageStale(
            resolutionEntry.lastPointTimestamp,
            requiredResolution,
        )
    ) {
        return true;
    }

    return isGraphHistoricResolutionStale(resolutionEntry.fetchedAt, requiredResolution);
};

export const ensureGraphFiatRates = createThunk(
    'wallet/graphFiat/ensureGraphFiatRates',
    async (
        {
            baseCurrencyCode,
            coinIds,
            resolution,
        }: {
            baseCurrencyCode: BaseCurrencyCode;
            coinIds: string[];
            resolution: GraphFiatResolution;
        },
        { dispatch, getState }: { dispatch: Dispatch; getState: () => AppState },
    ) => {
        const uniqueCoinIds = Array.from(new Set(coinIds)).filter(Boolean).sort();
        const graphFiatState = selectGraphFiatState(getState());
        const coinIdsMissingResolutionFromMemory = uniqueCoinIds.filter(coinId => {
            const entryKey = getGraphFiatEntryKey({ baseCurrencyCode, coinId, resolution });
            const resolutionEntry = graphFiatState[entryKey];

            return !resolutionEntry || resolutionEntry.points.length === 0;
        });

        if (coinIdsMissingResolutionFromMemory.length > 0) {
            const persistedEntries = await loadGraphFiatEntriesFromStorage({
                baseCurrencyCode,
                coinIds: coinIdsMissingResolutionFromMemory,
                resolution,
            });

            if (persistedEntries.length > 0) {
                dispatch(hydrateGraphFiatEntriesFromStorage(persistedEntries));
            }
        }

        await Promise.all(
            uniqueCoinIds.map(async coinId => {
                const resolutionEntry = selectGraphFiatResolutionEntry(
                    getState(),
                    coinId,
                    baseCurrencyCode,
                    resolution,
                );
                const shouldRefresh = shouldRefreshGraphFiatResolution(resolutionEntry, resolution);

                if (!shouldRefresh) {
                    return;
                }

                const inFlightKey = getGraphFiatEntryKey({
                    baseCurrencyCode,
                    coinId,
                    resolution,
                });
                const existing = inFlightGraphFiatRefreshes.get(inFlightKey);
                if (existing) {
                    await existing;

                    return;
                }

                const promise = Promise.resolve(
                    dispatch(
                        refreshGraphFiatResolution({
                            baseCurrencyCode,
                            coinId,
                            resolution,
                        }),
                    ),
                ).finally(() => {
                    inFlightGraphFiatRefreshes.delete(inFlightKey);
                });

                inFlightGraphFiatRefreshes.set(inFlightKey, promise);
                await promise;
            }),
        );
    },
);

export const selectGraphFiatResolutionSeriesByCoinIds = createSelector(
    [
        selectGraphFiatState,
        (_state: AppState, coinIds: string[]) => coinIds,
        (_state: AppState, _coinIds: string[], baseCurrencyCode: BaseCurrencyCode) =>
            baseCurrencyCode,
        (
            _state: AppState,
            _coinIds: string[],
            _baseCurrencyCode: BaseCurrencyCode,
            resolution: GraphFiatResolution,
        ) => resolution,
    ],
    (graphFiatState, coinIds, baseCurrencyCode, resolution): Record<string, GraphFiatPoint[]> =>
        Object.fromEntries(
            coinIds.map(coinId => [
                coinId,
                graphFiatState[getGraphFiatEntryKey({ baseCurrencyCode, coinId, resolution })]
                    ?.points ?? [],
            ]),
        ),
);

export const selectGraphFiatRequiredResolutionReady = createSelector(
    [
        selectGraphFiatState,
        (_state: AppState, coinIds: string[]) => coinIds,
        (_state: AppState, _coinIds: string[], baseCurrencyCode: BaseCurrencyCode) =>
            baseCurrencyCode,
        (
            _state: AppState,
            _coinIds: string[],
            _baseCurrencyCode: BaseCurrencyCode,
            resolution: GraphFiatResolution,
        ) => resolution,
    ],
    (graphFiatState, coinIds, baseCurrencyCode, resolution) =>
        coinIds.every(coinId => {
            const entry =
                graphFiatState[getGraphFiatEntryKey({ baseCurrencyCode, coinId, resolution })];

            return !!entry && (entry.points.length > 0 || entry.error !== null);
        }),
);

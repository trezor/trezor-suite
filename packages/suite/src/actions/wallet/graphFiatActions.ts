import { createAction, createSelector } from '@reduxjs/toolkit';

import {
    fetchGraphHistoricFiatRates,
    getGraphFiatFetchTimestamp,
    isGraphHistoricResolutionCoverageStale,
    isGraphHistoricResolutionStale,
} from '@suite-common/fiat-services';
import { createThunk } from '@suite-common/redux-utils';
import {
    type GraphFiatCoinEntry,
    type GraphFiatPoint,
    type GraphFiatResolution,
} from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { loadGraphFiatEntriesFromStorage } from 'src/support/wallet/graphFiatStorage';
import {
    getEmptyGraphFiatCoinEntry,
    getGraphFiatEntryKey,
} from 'src/support/wallet/graphFiatUtils';
import { type AppState, type Dispatch } from 'src/types/suite';

export const refreshGraphFiatResolution = createThunk(
    'wallet/graphFiat/refreshGraphFiatResolution',
    async ({
        baseCurrencyCode,
        coinId,
        resolution,
    }: {
        baseCurrencyCode: BaseCurrencyCode;
        coinId: string;
        resolution: GraphFiatResolution;
    }) => ({
        baseCurrencyCode,
        coinId,
        resolution,
        points: await fetchGraphHistoricFiatRates({ baseCurrencyCode, coinId, resolution }),
        fetchedAt: getGraphFiatFetchTimestamp(),
    }),
);

export const removeGraphFiatEntriesFromMemory = createAction(
    'wallet/graphFiat/removeGraphFiatEntriesFromMemory',
    (keys: string[]) => ({
        payload: { keys },
    }),
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
    (entries: { key: string; value: GraphFiatCoinEntry }[]) => ({
        payload: { entries },
    }),
);

export type GraphFiatAction =
    | ReturnType<typeof hydrateGraphFiatEntriesFromStorage>
    | ReturnType<typeof removeGraphFiatEntriesFromMemory>
    | ReturnType<typeof removeGraphFiatResolutionsFromMemory>;

const selectGraphFiatState = (state: AppState) => state.wallet.graphFiat;

export const selectGraphFiatCoinEntry = (
    state: AppState,
    coinId: string,
    baseCurrencyCode: BaseCurrencyCode,
): GraphFiatCoinEntry =>
    selectGraphFiatState(state)[getGraphFiatEntryKey({ baseCurrencyCode, coinId })] ??
    getEmptyGraphFiatCoinEntry(baseCurrencyCode);

export const selectGraphFiatResolutionEntry = (
    state: AppState,
    coinId: string,
    baseCurrencyCode: BaseCurrencyCode,
    resolution: GraphFiatResolution,
) => selectGraphFiatCoinEntry(state, coinId, baseCurrencyCode).resolutions[resolution];

const getResolutionToRefresh = (
    coinEntry: GraphFiatCoinEntry,
    requiredResolution: GraphFiatResolution,
) => {
    const resolutionEntry = coinEntry.resolutions[requiredResolution];

    if (resolutionEntry.isLoading) {
        return;
    }

    if (resolutionEntry.points.length === 0) {
        return {
            reason: 'missing' as const,
            resolution: requiredResolution,
        };
    }

    if (
        requiredResolution === 'day' &&
        isGraphHistoricResolutionCoverageStale(
            resolutionEntry.lastPointTimestamp,
            requiredResolution,
        )
    ) {
        return {
            reason: 'coverage' as const,
            resolution: requiredResolution,
        };
    }

    if (isGraphHistoricResolutionStale(resolutionEntry.fetchedAt, requiredResolution)) {
        return {
            reason: 'stale' as const,
            resolution: requiredResolution,
        };
    }
};

export const evictGraphFiatCurrenciesFromMemory = createThunk(
    'wallet/graphFiat/evictGraphFiatCurrenciesFromMemory',
    (
        { keepBaseCurrencyCode }: { keepBaseCurrencyCode: BaseCurrencyCode },
        { dispatch, getState }: { dispatch: Dispatch; getState: () => AppState },
    ) => {
        const evictedKeys = Object.keys(selectGraphFiatState(getState())).filter(
            key => !key.endsWith(`:${keepBaseCurrencyCode}`),
        );

        console.warn('[graphFiat] evict currency entries from memory', {
            evictedKeys,
            keepBaseCurrencyCode,
        });

        if (evictedKeys.length > 0) {
            dispatch(removeGraphFiatEntriesFromMemory(evictedKeys));
        }

        return {
            evictedKeys,
            keepBaseCurrencyCode,
        };
    },
);

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
            const entryKey = getGraphFiatEntryKey({ baseCurrencyCode, coinId });
            const coinEntry = graphFiatState[entryKey];

            if (!coinEntry) {
                return true;
            }

            return coinEntry.resolutions[resolution].points.length === 0;
        });

        if (coinIdsMissingResolutionFromMemory.length > 0) {
            console.warn('[graphFiat] graph fiat resolution missing from memory', {
                baseCurrencyCode,
                coinIdsMissingResolutionFromMemory,
                resolution,
            });

            const persistedEntries = await loadGraphFiatEntriesFromStorage({
                baseCurrencyCode,
                coinIds: coinIdsMissingResolutionFromMemory,
                resolution,
            });

            if (persistedEntries.length > 0) {
                console.warn('[graphFiat] hydrate graph fiat entries into memory', {
                    baseCurrencyCode,
                    hydratedKeys: persistedEntries.map(entry => entry.key),
                    resolution,
                });
                dispatch(hydrateGraphFiatEntriesFromStorage(persistedEntries));
            } else {
                console.warn('[graphFiat] no graph fiat entries hydrated from indexeddb', {
                    baseCurrencyCode,
                    coinIdsMissingResolutionFromMemory,
                    resolution,
                });
            }
        }

        console.warn('[graphFiat] ensure viewed resolution', {
            baseCurrencyCode,
            coinIds: uniqueCoinIds,
            resolution,
        });

        await Promise.all(
            uniqueCoinIds.map(async coinId => {
                const coinEntry = selectGraphFiatCoinEntry(getState(), coinId, baseCurrencyCode);
                const refresh = getResolutionToRefresh(coinEntry, resolution);

                if (!refresh) {
                    console.warn('[graphFiat] reuse viewed resolution from memory', {
                        baseCurrencyCode,
                        coinId,
                        points: coinEntry.resolutions[resolution].points.length,
                        resolution,
                    });

                    return;
                }

                console.warn(
                    `[graphFiat] ${refresh.reason === 'missing' ? 'fetch' : 'refetch'} ${coinId} ${resolution}`,
                    {
                        baseCurrencyCode,
                        fetchedAt: coinEntry.resolutions[resolution].fetchedAt,
                        lastPointTimestamp: coinEntry.resolutions[resolution].lastPointTimestamp,
                        points: coinEntry.resolutions[resolution].points.length,
                        reason: refresh.reason,
                    },
                );

                await dispatch(
                    refreshGraphFiatResolution({
                        baseCurrencyCode,
                        coinId,
                        resolution,
                    }),
                );
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
                graphFiatState[getGraphFiatEntryKey({ baseCurrencyCode, coinId })]?.resolutions[
                    resolution
                ].points ?? [],
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
                graphFiatState[getGraphFiatEntryKey({ baseCurrencyCode, coinId })]?.resolutions[
                    resolution
                ];

            return !!entry && (entry.points.length > 0 || entry.error !== null);
        }),
);

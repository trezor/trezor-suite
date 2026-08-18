import { setBaseCurrency } from '@suite-common/wallet-core';
import { type GraphFiatResolutionEntry, asTimestamp } from '@suite-common/wallet-types';

import { graphFiatReducer } from './graphFiatReducer';
import {
    hydrateGraphFiatEntriesFromStorage,
    refreshGraphFiatResolution,
    removeGraphFiatResolutionsFromMemory,
    shouldRefreshGraphFiatResolution,
} from '../../actions/wallet/graphFiatActions';

const createResolutionEntry = (
    overrides: Partial<GraphFiatResolutionEntry> = {},
): GraphFiatResolutionEntry => ({
    points: [],
    fetchedAt: null,
    failedAt: null,
    lastPointTimestamp: null,
    isLoading: false,
    error: null,
    ...overrides,
});

const hydrateGraphFiatState = (entries: Parameters<typeof hydrateGraphFiatEntriesFromStorage>[0]) =>
    graphFiatReducer(undefined, hydrateGraphFiatEntriesFromStorage(entries));

describe('graphFiatReducer', () => {
    it('hydrates one graph fiat resolution into memory on demand', () => {
        const dayEntry = createResolutionEntry({
            points: [{ time: 1, price: 1 }],
            fetchedAt: asTimestamp(1000),
            lastPointTimestamp: 1,
        });
        const state = hydrateGraphFiatState([{ key: 'bitcoin:usd:day', value: dayEntry }]);

        expect(state['bitcoin:usd:day']).toEqual(dayEntry);
    });

    it('updates one resolution without clobbering the others', () => {
        const monthEntry = createResolutionEntry({
            points: [{ time: 2, price: 2 }],
            fetchedAt: asTimestamp(2000),
            lastPointTimestamp: 2,
        });
        const maxEntry = createResolutionEntry({
            points: [{ time: 3, price: 3 }],
            fetchedAt: asTimestamp(3000),
            lastPointTimestamp: 3,
        });
        const initialState = hydrateGraphFiatState([
            {
                key: 'bitcoin:usd:day',
                value: createResolutionEntry({
                    points: [{ time: 1, price: 1 }],
                    fetchedAt: asTimestamp(1000),
                    lastPointTimestamp: 1,
                }),
            },
            { key: 'bitcoin:usd:month', value: monthEntry },
            { key: 'bitcoin:usd:max', value: maxEntry },
        ]);

        const state = graphFiatReducer(
            initialState,
            refreshGraphFiatResolution.fulfilled(
                {
                    coinId: 'bitcoin',
                    resolution: 'day',
                    baseCurrencyCode: 'usd',
                    points: [{ time: 10, price: 10 }],
                    fetchedAt: asTimestamp(4000),
                },
                'request-id',
                { baseCurrencyCode: 'usd', coinId: 'bitcoin', resolution: 'day' },
            ),
        );

        expect(state['bitcoin:usd:day']?.points).toEqual([{ time: 10, price: 10 }]);
        expect(state['bitcoin:usd:month']).toEqual(monthEntry);
        expect(state['bitcoin:usd:max']).toEqual(maxEntry);
    });

    it('retains stale points when a refresh fails', () => {
        const initialState = hydrateGraphFiatState([
            {
                key: 'bitcoin:usd:day',
                value: createResolutionEntry({
                    points: [{ time: 1, price: 1 }],
                    fetchedAt: asTimestamp(1000),
                    lastPointTimestamp: 1,
                    isLoading: true,
                }),
            },
        ]);

        const state = graphFiatReducer(
            initialState,
            refreshGraphFiatResolution.rejected(
                null,
                'request-id',
                { baseCurrencyCode: 'usd', coinId: 'bitcoin', resolution: 'day' },
                {
                    failedAt: asTimestamp(4000),
                    message: 'CoinGecko returned no valid historical prices.',
                },
            ),
        );

        expect(state['bitcoin:usd:day']).toEqual({
            points: [{ time: 1, price: 1 }],
            fetchedAt: asTimestamp(1000),
            failedAt: asTimestamp(4000),
            lastPointTimestamp: 1,
            isLoading: false,
            error: 'CoinGecko returned no valid historical prices.',
        });
    });

    it('does not retry a failed resolution during its cooldown', () => {
        const failedAt = asTimestamp(Date.now());
        const failedEntry = createResolutionEntry({
            error: 'Request failed.',
            failedAt,
        });

        expect(shouldRefreshGraphFiatResolution(failedEntry, 'day')).toBe(false);
    });

    it('replaces refreshed month points with the latest full month dataset', () => {
        const initialState = hydrateGraphFiatState([
            {
                key: 'bitcoin:usd:month',
                value: createResolutionEntry({
                    points: [
                        { time: 1, price: 1 },
                        { time: 2, price: 2 },
                    ],
                    fetchedAt: asTimestamp(2000),
                    lastPointTimestamp: 2,
                }),
            },
        ]);

        const state = graphFiatReducer(
            initialState,
            refreshGraphFiatResolution.fulfilled(
                {
                    coinId: 'bitcoin',
                    resolution: 'month',
                    baseCurrencyCode: 'usd',
                    points: [
                        { time: 2, price: 20 },
                        { time: 3, price: 30 },
                    ],
                    fetchedAt: asTimestamp(4000),
                },
                'request-id',
                { baseCurrencyCode: 'usd', coinId: 'bitcoin', resolution: 'month' },
            ),
        );

        expect(state['bitcoin:usd:month']?.points).toEqual([
            { time: 2, price: 20 },
            { time: 3, price: 30 },
        ]);
        expect(state['bitcoin:usd:month']?.lastPointTimestamp).toBe(3);
    });

    it('hydrates missing resolutions without clobbering in-memory ones', () => {
        const currentDayEntry = createResolutionEntry({
            points: [{ time: 10, price: 10 }],
            fetchedAt: asTimestamp(1000),
            lastPointTimestamp: 10,
        });
        const persistedMonthEntry = createResolutionEntry({
            points: [{ time: 2, price: 2 }],
            fetchedAt: asTimestamp(2000),
            lastPointTimestamp: 2,
        });
        const initialState = hydrateGraphFiatState([
            { key: 'bitcoin:usd:day', value: currentDayEntry },
        ]);

        const state = graphFiatReducer(
            initialState,
            hydrateGraphFiatEntriesFromStorage([
                {
                    key: 'bitcoin:usd:day',
                    value: createResolutionEntry({
                        points: [{ time: 1, price: 1 }],
                        fetchedAt: asTimestamp(500),
                        lastPointTimestamp: 1,
                    }),
                },
                { key: 'bitcoin:usd:month', value: persistedMonthEntry },
            ]),
        );

        expect(state['bitcoin:usd:day']).toEqual(currentDayEntry);
        expect(state['bitcoin:usd:month']).toEqual(persistedMonthEntry);
    });

    it('evicts one resolution without removing the others', () => {
        const dayEntry = createResolutionEntry({ points: [{ time: 1, price: 1 }] });
        const monthEntry = createResolutionEntry({ points: [{ time: 2, price: 2 }] });
        const initialState = hydrateGraphFiatState([
            { key: 'bitcoin:usd:day', value: dayEntry },
            { key: 'bitcoin:usd:month', value: monthEntry },
        ]);

        const state = graphFiatReducer(
            initialState,
            removeGraphFiatResolutionsFromMemory([
                {
                    baseCurrencyCode: 'usd',
                    coinId: 'bitcoin',
                    resolution: 'month',
                },
            ]),
        );

        expect(state['bitcoin:usd:day']).toEqual(dayEntry);
        expect(state['bitcoin:usd:month']).toBeUndefined();
    });

    it('stores entries per currency and evicts inactive currencies', () => {
        const initialState = graphFiatReducer(undefined, { type: 'noop' });
        const usdState = graphFiatReducer(
            initialState,
            refreshGraphFiatResolution.fulfilled(
                {
                    baseCurrencyCode: 'usd',
                    coinId: 'bitcoin',
                    resolution: 'day',
                    points: [{ time: 10, price: 10 }],
                    fetchedAt: asTimestamp(4000),
                },
                'request-id',
                { baseCurrencyCode: 'usd', coinId: 'bitcoin', resolution: 'day' },
            ),
        );
        const finalState = graphFiatReducer(
            usdState,
            refreshGraphFiatResolution.fulfilled(
                {
                    baseCurrencyCode: 'eur',
                    coinId: 'bitcoin',
                    resolution: 'day',
                    points: [{ time: 10, price: 20 }],
                    fetchedAt: asTimestamp(5000),
                },
                'request-id',
                { baseCurrencyCode: 'eur', coinId: 'bitcoin', resolution: 'day' },
            ),
        );

        expect(finalState['bitcoin:usd:day']?.points).toEqual([{ time: 10, price: 10 }]);
        expect(finalState['bitcoin:eur:day']?.points).toEqual([{ time: 10, price: 20 }]);

        const evictedState = graphFiatReducer(finalState, setBaseCurrency('eur'));

        expect(evictedState['bitcoin:usd:day']).toBeUndefined();
        expect(evictedState['bitcoin:eur:day']?.points).toEqual([{ time: 10, price: 20 }]);
    });
});

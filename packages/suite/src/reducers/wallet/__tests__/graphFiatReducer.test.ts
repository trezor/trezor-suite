import { asTimestamp } from '@suite-common/wallet-types';

import {
    hydrateGraphFiatEntriesFromStorage,
    refreshGraphFiatResolution,
    removeGraphFiatResolutionsFromMemory,
} from '../../../actions/wallet/graphFiatActions';
import { graphFiatReducer } from '../graphFiatReducer';

const hydrateGraphFiatState = (entries: Parameters<typeof hydrateGraphFiatEntriesFromStorage>[0]) =>
    graphFiatReducer(undefined, hydrateGraphFiatEntriesFromStorage(entries));

describe('graphFiatReducer', () => {
    it('hydrates graph fiat rates into memory on demand', () => {
        const state = hydrateGraphFiatState([
            {
                key: 'bitcoin:usd',
                value: {
                    currency: 'usd',
                    resolutions: {
                        day: {
                            points: [{ time: 1, price: 1 }],
                            fetchedAt: asTimestamp(1000),
                            lastPointTimestamp: 1,
                            isLoading: false,
                            error: null,
                        },
                        month: {
                            points: [],
                            fetchedAt: null,
                            lastPointTimestamp: null,
                            isLoading: false,
                            error: null,
                        },
                        max: {
                            points: [],
                            fetchedAt: null,
                            lastPointTimestamp: null,
                            isLoading: false,
                            error: null,
                        },
                    },
                },
            },
        ]);

        expect(state['bitcoin:usd']?.resolutions.day.points).toEqual([{ time: 1, price: 1 }]);
    });

    it('updates one resolution without clobbering the others', () => {
        const initialState = hydrateGraphFiatState([
            {
                key: 'bitcoin:usd',
                value: {
                    currency: 'usd',
                    resolutions: {
                        day: {
                            points: [{ time: 1, price: 1 }],
                            fetchedAt: asTimestamp(1000),
                            lastPointTimestamp: 1,
                            isLoading: false,
                            error: null,
                        },
                        month: {
                            points: [{ time: 2, price: 2 }],
                            fetchedAt: asTimestamp(2000),
                            lastPointTimestamp: 2,
                            isLoading: false,
                            error: null,
                        },
                        max: {
                            points: [{ time: 3, price: 3 }],
                            fetchedAt: asTimestamp(3000),
                            lastPointTimestamp: 3,
                            isLoading: false,
                            error: null,
                        },
                    },
                },
            },
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

        expect(state['bitcoin:usd']?.resolutions.day.points).toEqual([{ time: 10, price: 10 }]);
        expect(state['bitcoin:usd']?.resolutions.month.points).toEqual([{ time: 2, price: 2 }]);
        expect(state['bitcoin:usd']?.resolutions.max.points).toEqual([{ time: 3, price: 3 }]);
    });

    it('replaces refreshed month points with the latest full month dataset', () => {
        const initialState = hydrateGraphFiatState([
            {
                key: 'bitcoin:usd',
                value: {
                    currency: 'usd',
                    resolutions: {
                        day: {
                            points: [],
                            fetchedAt: null,
                            lastPointTimestamp: null,
                            isLoading: false,
                            error: null,
                        },
                        month: {
                            points: [
                                { time: 1, price: 1 },
                                { time: 2, price: 2 },
                            ],
                            fetchedAt: asTimestamp(2000),
                            lastPointTimestamp: 2,
                            isLoading: false,
                            error: null,
                        },
                        max: {
                            points: [],
                            fetchedAt: null,
                            lastPointTimestamp: null,
                            isLoading: false,
                            error: null,
                        },
                    },
                },
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

        expect(state['bitcoin:usd']?.resolutions.month.points).toEqual([
            { time: 2, price: 20 },
            { time: 3, price: 30 },
        ]);
        expect(state['bitcoin:usd']?.resolutions.month.lastPointTimestamp).toBe(3);
    });

    it('hydrates graph fiat entries from indexeddb on demand', () => {
        const state = hydrateGraphFiatState([
            {
                key: 'bitcoin:usd',
                value: {
                    currency: 'usd',
                    resolutions: {
                        day: {
                            points: [{ time: 1, price: 1 }],
                            fetchedAt: asTimestamp(1000),
                            lastPointTimestamp: 1,
                            isLoading: false,
                            error: null,
                        },
                        month: {
                            points: [],
                            fetchedAt: null,
                            lastPointTimestamp: null,
                            isLoading: false,
                            error: null,
                        },
                        max: {
                            points: [],
                            fetchedAt: null,
                            lastPointTimestamp: null,
                            isLoading: false,
                            error: null,
                        },
                    },
                },
            },
        ]);

        expect(state['bitcoin:usd']?.resolutions.day.points).toEqual([{ time: 1, price: 1 }]);
    });

    it('hydrates missing resolutions from indexeddb without clobbering in-memory ones', () => {
        const initialState = hydrateGraphFiatState([
            {
                key: 'bitcoin:usd',
                value: {
                    currency: 'usd',
                    resolutions: {
                        day: {
                            points: [{ time: 10, price: 10 }],
                            fetchedAt: asTimestamp(1000),
                            lastPointTimestamp: 10,
                            isLoading: false,
                            error: null,
                        },
                        month: {
                            points: [],
                            fetchedAt: null,
                            lastPointTimestamp: null,
                            isLoading: false,
                            error: null,
                        },
                        max: {
                            points: [],
                            fetchedAt: null,
                            lastPointTimestamp: null,
                            isLoading: false,
                            error: null,
                        },
                    },
                },
            },
        ]);

        const state = graphFiatReducer(
            initialState,
            hydrateGraphFiatEntriesFromStorage([
                {
                    key: 'bitcoin:usd',
                    value: {
                        currency: 'usd',
                        resolutions: {
                            day: {
                                points: [{ time: 1, price: 1 }],
                                fetchedAt: asTimestamp(500),
                                lastPointTimestamp: 1,
                                isLoading: false,
                                error: null,
                            },
                            month: {
                                points: [{ time: 2, price: 2 }],
                                fetchedAt: asTimestamp(2000),
                                lastPointTimestamp: 2,
                                isLoading: false,
                                error: null,
                            },
                            max: {
                                points: [],
                                fetchedAt: null,
                                lastPointTimestamp: null,
                                isLoading: false,
                                error: null,
                            },
                        },
                    },
                },
            ]),
        );

        expect(state['bitcoin:usd']?.resolutions.day.points).toEqual([{ time: 10, price: 10 }]);
        expect(state['bitcoin:usd']?.resolutions.month.points).toEqual([{ time: 2, price: 2 }]);
    });

    it('evicts one resolution without removing the whole coin entry', () => {
        const initialState = hydrateGraphFiatState([
            {
                key: 'bitcoin:usd',
                value: {
                    currency: 'usd',
                    resolutions: {
                        day: {
                            points: [{ time: 1, price: 1 }],
                            fetchedAt: asTimestamp(1000),
                            lastPointTimestamp: 1,
                            isLoading: false,
                            error: null,
                        },
                        month: {
                            points: [{ time: 2, price: 2 }],
                            fetchedAt: asTimestamp(2000),
                            lastPointTimestamp: 2,
                            isLoading: false,
                            error: null,
                        },
                        max: {
                            points: [{ time: 3, price: 3 }],
                            fetchedAt: asTimestamp(3000),
                            lastPointTimestamp: 3,
                            isLoading: false,
                            error: null,
                        },
                    },
                },
            },
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

        expect(state['bitcoin:usd']?.resolutions.day.points).toEqual([{ time: 1, price: 1 }]);
        expect(state['bitcoin:usd']?.resolutions.month.points).toEqual([]);
        expect(state['bitcoin:usd']?.resolutions.month.fetchedAt).toBeNull();
        expect(state['bitcoin:usd']?.resolutions.max.points).toEqual([{ time: 3, price: 3 }]);
    });

    it('stores separate graph fiat entries per currency', () => {
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

        expect(finalState['bitcoin:usd']?.resolutions.day.points).toEqual([
            { time: 10, price: 10 },
        ]);
        expect(finalState['bitcoin:eur']?.resolutions.day.points).toEqual([
            { time: 10, price: 20 },
        ]);
    });
});

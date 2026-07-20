import { type AccountItem } from '@suite-common/graph';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';

import {
    type GraphInstanceId,
    getGraphInstanceStateKey,
    getPortfolioGraphInstanceId,
} from '../graphInstances';
import { graphPersistTransform } from '../graphPersistTransform';
import { selectGraphTimeframe } from '../graphSelectors';
import { RefetchGraphThunkStatus } from '../graphThunkTypes';
import { refetchGraphThunk } from '../graphThunks';
import {
    type GraphSliceRootState,
    graphInitialState,
    graphReducer,
    resetGraphRuntimeState,
} from '../slice';

const instanceId = getPortfolioGraphInstanceId();
const stateKey = getGraphInstanceStateKey(instanceId);

const refetchGraphThunkArg = {
    instanceId,
    accounts: [
        {
            symbol: 'btc' as NetworkSymbol,
            descriptor: 'descriptor',
            accountKey: 'account-key' as AccountKey,
        },
    ] satisfies AccountItem[],
    timeframeHours: 24,
    isElectrumBackend: false,
    baseCurrencyCode: 'usd' as const,
};

describe('graphReducer', () => {
    it('stores fetched graph points and events', () => {
        const state = graphReducer(
            graphInitialState,
            refetchGraphThunk.fulfilled(
                {
                    status: RefetchGraphThunkStatus.Fetched,
                    points: [{ date: 1000, value: 1 }],
                    events: [
                        {
                            date: 2000,
                            payload: {
                                received: 1,
                                sent: 0,
                                sentTransactionsCount: 0,
                                receivedTransactionsCount: 1,
                                symbol: 'btc',
                                accountKey: 'account-key' as AccountKey,
                            },
                        },
                    ],
                },
                'request-id',
                refetchGraphThunkArg,
            ),
        );

        expect(state.graphs[stateKey]?.points).toEqual([{ date: 1000, value: 1 }]);
        expect(state.graphs[stateKey]?.events).toEqual([
            {
                date: 2000,
                payload: {
                    received: 1,
                    sent: 0,
                    sentTransactionsCount: 0,
                    receivedTransactionsCount: 1,
                    symbol: 'btc',
                    accountKey: 'account-key',
                },
            },
        ]);
    });

    it('keeps last successful graph data when refetch fails', () => {
        const stateWithFetchedData = graphReducer(
            graphInitialState,
            refetchGraphThunk.fulfilled(
                {
                    status: RefetchGraphThunkStatus.Fetched,
                    points: [{ date: 1000, value: 1 }],
                    events: [
                        {
                            date: 2000,
                            payload: {
                                received: 1,
                                sent: 0,
                                sentTransactionsCount: 0,
                                receivedTransactionsCount: 1,
                                symbol: 'btc',
                                accountKey: 'account-key' as AccountKey,
                            },
                        },
                    ],
                },
                'request-id',
                refetchGraphThunkArg,
            ),
        );

        const state = graphReducer(
            stateWithFetchedData,
            refetchGraphThunk.rejected(
                new Error('Fetch failed'),
                'request-id',
                refetchGraphThunkArg,
                'Fetch failed',
            ),
        );

        expect(state.graphs[stateKey]?.points).toEqual([{ date: 1000, value: 1 }]);
        expect(state.graphs[stateKey]?.events).toEqual(
            stateWithFetchedData.graphs[stateKey]?.events,
        );
        expect(state.graphs[stateKey]?.error).toBe('Fetch failed');
    });

    it('resets runtime status without removing fetched data', () => {
        const state = graphReducer(
            {
                graphs: {
                    [stateKey]: {
                        timeframeHours: 24,
                        isLoading: true,
                        error: 'Fetch failed',
                        points: [{ date: 1000, value: 1 }],
                        events: [],
                    },
                },
            },
            resetGraphRuntimeState({ instanceId }),
        );

        expect(state.graphs[stateKey]).toEqual({
            timeframeHours: 24,
            points: [{ date: 1000, value: 1 }],
            events: [],
        });
    });

    it('rejects graph instance IDs that could access object prototypes', () => {
        expect(() =>
            graphReducer(
                graphInitialState,
                refetchGraphThunk.pending('request-id', {
                    ...refetchGraphThunkArg,
                    instanceId: '__proto__' as GraphInstanceId,
                }),
            ),
        ).toThrow('Invalid graph instance ID.');
    });
});

describe('all-time graph timeframe', () => {
    it('selects null as the all-time timeframe', () => {
        const state: GraphSliceRootState = {
            graph: {
                graphs: {
                    [stateKey]: { timeframeHours: null },
                },
            },
        };

        expect(selectGraphTimeframe(state, instanceId)).toBeNull();
    });

    it('rehydrates null as the all-time timeframe', () => {
        const state = graphPersistTransform.out(
            { graphs: { [instanceId]: { timeframeHours: null } } },
            'graph',
            {},
        );

        expect(state.graphs[stateKey]?.timeframeHours).toBeNull();
    });
});

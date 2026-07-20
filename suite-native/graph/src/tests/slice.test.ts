import { type AccountItem } from '@suite-common/graph';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AccountKey } from '@suite-common/wallet-types';
import { type BaseCurrencyCode } from '@trezor/blockchain-link-types';

import { getPortfolioGraphInstanceId } from '../graphInstances';
import { RefetchGraphThunkStatus } from '../graphThunkTypes';
import { refetchGraphThunk } from '../graphThunks';
import { graphInitialState, graphReducer } from '../slice';

const instanceId = getPortfolioGraphInstanceId();

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
    baseCurrencyCode: 'usd' as BaseCurrencyCode,
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

        expect(state.graphs[instanceId]?.points).toEqual([{ date: 1000, value: 1 }]);
        expect(state.graphs[instanceId]?.events).toEqual([
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

        expect(state.graphs[instanceId]?.points).toEqual([{ date: 1000, value: 1 }]);
        expect(state.graphs[instanceId]?.events).toEqual(
            stateWithFetchedData.graphs[instanceId]?.events,
        );
        expect(state.graphs[instanceId]?.error).toBe('Fetch failed');
    });
});

import { testMocks } from '@suite-common/test-utils';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';

import {
    ACCOUNT_GRAPH_FAIL,
    ACCOUNT_GRAPH_START,
    ACCOUNT_GRAPH_SUCCESS,
} from 'src/actions/wallet/constants/graphConstants';
import { fetchAccountGraphData } from 'src/actions/wallet/graphActions';
import { configureStore } from 'src/support/tests/configureStore';
import { type GraphRange } from 'src/types/wallet/graph';

const selectedRange: GraphRange = {
    label: 'all',
    startDate: null,
    endDate: null,
    groupBy: 'day',
};

const graphHistoryPoint = {
    time: 1_700_000_000,
    txs: 1,
    received: '1',
    sent: '0',
    sentToSelf: '0',
    rates: {},
};

const account = mockWalletAccount({
    symbol: 'btc',
    descriptor: asAccountDescriptor('xpub-test'),
    formattedBalance: '1',
});

const getInitialState = () =>
    ({
        suiteSettings: {
            experimental: ['new-balance-graph'],
        },
        wallet: {
            settings: {
                localCurrency: 'usd',
            },
            blockchain: {
                btc: {
                    backends: {
                        selected: 'blockbook',
                    },
                },
            },
            graph: {
                data: [],
                selectedRange,
            },
        },
    }) as any;

describe('Graph actions', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('preserves already fetched history when a later segment fails', async () => {
        testMocks.setTrezorConnectFixtures([
            {
                success: true,
                payload: [graphHistoryPoint],
            },
            {
                success: false,
            },
        ]);

        const store = configureStore<any, any>()(getInitialState());

        const result = await store.dispatch(
            fetchAccountGraphData(account, {
                selectedRange,
                emitUpdates: true,
            }),
        );

        expect(result).toMatchObject({
            account: {
                descriptor: account.descriptor,
                deviceState: account.deviceState,
                symbol: account.symbol,
            },
            error: false,
            isLoading: false,
            rawData: [graphHistoryPoint],
            fetchedRange: {
                from: graphHistoryPoint.time,
                to: graphHistoryPoint.time,
            },
        });

        const actions = store.getActions();

        expect(actions.map(action => action.type)).toEqual([
            ACCOUNT_GRAPH_START,
            ACCOUNT_GRAPH_SUCCESS,
            ACCOUNT_GRAPH_SUCCESS,
        ]);
        expect(actions.some(action => action.type === ACCOUNT_GRAPH_FAIL)).toBe(false);
        expect(actions[actions.length - 1]).toMatchObject({
            type: ACCOUNT_GRAPH_SUCCESS,
            payload: {
                error: false,
                isLoading: false,
                rawData: [graphHistoryPoint],
            },
        });
    });
});

import { asNetworkSymbol } from '@suite-common/wallet-config';
import { asAccountDescriptor } from '@suite-common/wallet-types';
import { type StaticSessionId } from '@trezor/connect';

import { GRAPH } from 'src/actions/wallet/constants';
import { type AccountHistoryWithBalance, type AccountIdentifier } from 'src/types/wallet/graph';

import graphReducer from './graphReducer';

const account: AccountIdentifier = {
    deviceState: 'mvbu1Gdy8SUjTenqerxUaZyYjmveZvt33q@ABC123:1' as StaticSessionId,
    descriptor: asAccountDescriptor('xpub123'),
    symbol: asNetworkSymbol('btc'),
};

const dataPoint: AccountHistoryWithBalance = {
    time: 1720000000,
    txs: 2,
    received: '1',
    sent: '0',
    rates: {},
    balance: '1',
};

const getStateWithData = () =>
    graphReducer(undefined, {
        type: GRAPH.ACCOUNT_GRAPH_SUCCESS,
        payload: { account, data: [dataPoint], isLoading: false, error: false },
    });

describe('graphReducer', () => {
    it('ACCOUNT_GRAPH_START keeps existing data while loading', () => {
        const state = graphReducer(getStateWithData(), {
            type: GRAPH.ACCOUNT_GRAPH_START,
            payload: { account, isLoading: true, error: false },
        });

        expect(state.data[0]?.data).toEqual([dataPoint]);
        expect(state.data[0]?.isLoading).toBe(true);
        expect(state.data[0]?.error).toBe(false);
    });

    it('ACCOUNT_GRAPH_FAIL keeps existing data and sets error', () => {
        const state = graphReducer(getStateWithData(), {
            type: GRAPH.ACCOUNT_GRAPH_FAIL,
            payload: { account, isLoading: false, error: true },
        });

        expect(state.data[0]?.data).toEqual([dataPoint]);
        expect(state.data[0]?.isLoading).toBe(false);
        expect(state.data[0]?.error).toBe(true);
        expect(state.error).toEqual([account]);
    });

    it('ACCOUNT_GRAPH_START creates an empty entry for an unknown account', () => {
        const state = graphReducer(undefined, {
            type: GRAPH.ACCOUNT_GRAPH_START,
            payload: { account, isLoading: true, error: false },
        });

        expect(state.data[0]).toEqual({ account, data: [], isLoading: true, error: false });
    });

    it('ACCOUNT_GRAPH_SUCCESS replaces data and clears error', () => {
        const failedState = graphReducer(getStateWithData(), {
            type: GRAPH.ACCOUNT_GRAPH_FAIL,
            payload: { account, isLoading: false, error: true },
        });

        const newDataPoint = { ...dataPoint, time: 1720100000 };
        const state = graphReducer(failedState, {
            type: GRAPH.ACCOUNT_GRAPH_SUCCESS,
            payload: { account, data: [newDataPoint], isLoading: false, error: false },
        });

        expect(state.data[0]?.data).toEqual([newDataPoint]);
        expect(state.data[0]?.error).toBe(false);
        expect(state.error).toBeNull();
    });
});

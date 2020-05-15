import produce from 'immer';
import { BlockchainAccountBalanceHistory } from 'trezor-connect';
import { ACCOUNT, GRAPH } from '@wallet-actions/constants';
import { STORAGE } from '@suite-actions/constants';
import { WalletAction, Network, Account } from '@wallet-types';
import { Action as SuiteAction } from '@suite-types';
import { GraphRange } from '@suite/types/wallet/fiatRates';
import { SETTINGS } from '@suite-config';
// import { SETTINGS } from '@suite-config';

interface AccountIdentifier {
    descriptor: string;
    deviceState: string;
    symbol: Network['symbol'];
}

export interface GraphData {
    account: AccountIdentifier;
    interval: GraphRange['label'];
    error: boolean;
    isLoading: boolean;
    data: BlockchainAccountBalanceHistory[] | null;
}

interface State {
    // put interval fields in data;
    data: GraphData[];
    error: { [k in GraphData['interval']]: null | AccountIdentifier[] };
    isLoading: { [k in GraphData['interval']]: boolean };
    selectedRange: GraphRange;
}

const initialState: State = {
    data: [],
    selectedRange: SETTINGS.DEFAULT_GRAPH_RANGE,
    error: {
        all: null,
        year: null,
        month: null,
        week: null,
    },
    isLoading: {
        all: false,
        year: false,
        month: false,
        week: false,
    },
    // selectedRange: SETTINGS.DEFAULT_GRAPH_RANGE,
};

const updateError = (draft: State, interval?: GraphRange['label']) => {
    const intervals = interval ? [interval] : (['week', 'month', 'year', 'all'] as const);

    intervals.forEach(interval => {
        const failedGraphData = draft.data.filter(d => d.error && d.interval === interval);
        if (failedGraphData.length > 0) {
            draft.error[interval] = failedGraphData.map(a => a.account);
        } else {
            draft.error[interval] = null;
        }
    });
};

const update = (draft: State, payload: GraphData) => {
    const { account, data, error, interval, isLoading } = payload;
    const dataIndex = draft.data.findIndex(
        d =>
            d.account.deviceState === account.deviceState &&
            d.account.descriptor === account.descriptor &&
            d.account.symbol === account.symbol &&
            d.interval === interval,
    );
    if (dataIndex !== -1) {
        draft.data[dataIndex].data = data;
        draft.data[dataIndex].error = error;
        draft.data[dataIndex].isLoading = isLoading;
    } else {
        draft.data.push({
            account: {
                deviceState: account.deviceState,
                descriptor: account.descriptor,
                symbol: account.symbol,
            },
            isLoading,
            interval,
            error,
            data,
        });
    }

    updateError(draft, interval);
};

const remove = (draft: State, accounts: Account[]) => {
    accounts.forEach(account => {
        const affected = draft.data.filter(
            d =>
                d.account.deviceState === account.deviceState &&
                d.account.descriptor === account.descriptor &&
                d.account.symbol === account.symbol,
        );
        affected.forEach(d => {
            const index = draft.data.indexOf(d);
            draft.data.splice(index, 1);
        });
    });
    updateError(draft);
};

export default (state: State = initialState, action: WalletAction | SuiteAction): State => {
    return produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOADED:
                return action.payload.wallet.graph;
            case GRAPH.ACCOUNT_GRAPH_START:
                update(draft, { ...action.payload, data: null, isLoading: true, error: false });
                break;
            case GRAPH.ACCOUNT_GRAPH_SUCCESS:
                update(draft, { ...action.payload, isLoading: false, error: false });
                break;
            case GRAPH.ACCOUNT_GRAPH_FAIL:
                update(draft, { ...action.payload, data: null, isLoading: false, error: true });
                break;
            case GRAPH.AGGREGATED_GRAPH_START:
                draft.isLoading[action.payload.interval] = true;
                break;
            case GRAPH.AGGREGATED_GRAPH_SUCCESS:
                draft.isLoading[action.payload.interval] = false;
                break;
            case GRAPH.SET_SELECTED_RANGE:
                draft.selectedRange = action.payload;
                break;
            case ACCOUNT.REMOVE:
                return remove(draft, action.payload);
            // no default
        }
    });
};

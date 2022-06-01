import produce from 'immer';
import { ACCOUNT, GRAPH } from '@wallet-actions/constants';
import { STORAGE } from '@suite-actions/constants';
import { WalletAction, Account } from '@wallet-types';
import { GraphRange, GraphScale, AccountIdentifier, GraphData } from '@wallet-types/graph';
import { Action as SuiteAction } from '@suite-types';
import { SETTINGS } from '@suite-config';

export interface State {
    data: GraphData[];
    error: null | AccountIdentifier[];
    isLoading: boolean;
    selectedRange: GraphRange;
    selectedView: GraphScale;
}

const initialState: State = {
    data: [],
    selectedRange: SETTINGS.DEFAULT_GRAPH_RANGE,
    selectedView: 'linear',
    error: null,
    isLoading: false,
    // selectedRange: SETTINGS.DEFAULT_GRAPH_RANGE,
};

const updateError = (draft: State) => {
    const failedGraphData = draft.data.filter(d => d.error);
    if (failedGraphData.length > 0) {
        draft.error = failedGraphData.map(a => a.account);
    } else {
        draft.error = null;
    }
};

const update = (draft: State, payload: GraphData) => {
    const { account, data, error, isLoading } = payload;
    const dataIndex = draft.data.findIndex(
        d =>
            d.account.deviceState === account.deviceState &&
            d.account.descriptor === account.descriptor &&
            d.account.symbol === account.symbol,
    );
    if (dataIndex !== -1) {
        draft.data[dataIndex].data = data;
        draft.data[dataIndex].error = error;
        draft.data[dataIndex].isLoading = isLoading;
    } else {
        draft.data.push({
            account,
            isLoading,
            error,
            data,
        });
    }

    updateError(draft);
};

const loadFromStorage = (draft: State, payload: GraphData[] = []) => {
    draft.data = payload;
    updateError(draft);
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

const graphReducer = (state: State = initialState, action: WalletAction | SuiteAction): State =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                loadFromStorage(draft, action.payload?.graph);
                break;
            case GRAPH.ACCOUNT_GRAPH_START:
                update(draft, action.payload);
                break;
            case GRAPH.ACCOUNT_GRAPH_SUCCESS:
                update(draft, action.payload);
                break;
            case GRAPH.ACCOUNT_GRAPH_FAIL:
                update(draft, action.payload);
                break;
            case GRAPH.AGGREGATED_GRAPH_START:
                draft.isLoading = true;
                break;
            case GRAPH.AGGREGATED_GRAPH_SUCCESS:
                draft.isLoading = false;
                break;
            case GRAPH.SET_SELECTED_RANGE:
                draft.selectedRange = action.payload;
                break;
            case GRAPH.SET_SELECTED_VIEW:
                draft.selectedView = action.payload;
                break;
            case ACCOUNT.REMOVE:
                remove(draft, action.payload);
                break;
            // no default
        }
    });

export default graphReducer;

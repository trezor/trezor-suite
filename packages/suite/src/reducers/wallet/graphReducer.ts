import { produce } from 'immer';

import { accountsActions } from '@suite-common/wallet-core';

import { STORAGE } from 'src/actions/suite/constants';
import { GRAPH } from 'src/actions/wallet/constants';
import { SETTINGS } from 'src/config/suite';
import { type Action as SuiteAction } from 'src/types/suite';
import { type Account, type WalletAction } from 'src/types/wallet';
import { type AccountIdentifier, type GraphData, type GraphRange } from 'src/types/wallet/graph';

export interface GraphState {
    data: GraphData[];
    error: null | AccountIdentifier[];
    isLoading: boolean;
    selectedRange: GraphRange;
}

const initialState: GraphState = {
    data: [],
    selectedRange: SETTINGS.DEFAULT_GRAPH_RANGE,
    error: null,
    isLoading: false,
};

const updateError = (draft: GraphState) => {
    const failedGraphData = draft.data.filter(d => d.error);
    if (failedGraphData.length > 0) {
        draft.error = failedGraphData.map(a => a.account);
    } else {
        draft.error = null;
    }
};

const findEntryIndex = (draft: GraphState, account: AccountIdentifier) =>
    draft.data.findIndex(
        d =>
            d.account.deviceState === account.deviceState &&
            d.account.descriptor === account.descriptor &&
            d.account.symbol === account.symbol,
    );

const update = (draft: GraphState, payload: GraphData) => {
    const { account, data, error, isLoading } = payload;
    const dataIndex = findEntryIndex(draft, account);
    if (dataIndex !== -1) {
        const entry = draft.data[dataIndex];
        if (entry) {
            entry.data = data;
            entry.error = error;
            entry.isLoading = isLoading;
        }
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

const updateProgress = (draft: GraphState, payload: Omit<GraphData, 'data'>) => {
    const { account, error, isLoading } = payload;
    const dataIndex = findEntryIndex(draft, account);
    if (dataIndex !== -1) {
        const entry = draft.data[dataIndex];
        if (entry) {
            entry.error = error;
            entry.isLoading = isLoading;
        }
    } else {
        draft.data.push({
            account,
            isLoading,
            error,
            data: [],
        });
    }

    updateError(draft);
};

const loadFromStorage = (draft: GraphState, payload: GraphData[] = []) => {
    draft.data = payload;
    updateError(draft);
};

const remove = (draft: GraphState, accounts: Account[]) => {
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

const graphReducer = (
    state: GraphState = initialState,
    action: WalletAction | SuiteAction,
): GraphState =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                loadFromStorage(draft, action.payload.graph);
                break;
            case GRAPH.ACCOUNT_GRAPH_START:
                updateProgress(draft, action.payload);
                break;
            case GRAPH.ACCOUNT_GRAPH_SUCCESS:
                update(draft, action.payload);
                break;
            case GRAPH.ACCOUNT_GRAPH_FAIL:
                updateProgress(draft, action.payload);
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
            case accountsActions.removeAccount.type: {
                if (accountsActions.removeAccount.match(action)) {
                    remove(draft, action.payload);
                }
                break;
            }
            // no default
        }
    });

export default graphReducer;

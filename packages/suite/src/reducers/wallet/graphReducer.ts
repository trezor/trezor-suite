import { produce } from 'immer';
import { type Action as ReduxAction } from 'redux';

import { accountsActions } from '@suite-common/wallet-core';
import { isArrayMember } from '@trezor/utils';

import { STORAGE } from 'src/actions/suite/constants';
import { type StorageLoadAction } from 'src/actions/suite/storageActions';
import { GRAPH } from 'src/actions/wallet/constants';
import { type GraphAction } from 'src/actions/wallet/graphActions';
import { SETTINGS } from 'src/config/suite';
import { type Account } from 'src/types/wallet';
import { type AccountIdentifier, type GraphData, type GraphRange } from 'src/types/wallet/graph';

type GraphReducerAction =
    | GraphAction
    | StorageLoadAction
    | ReturnType<typeof accountsActions.removeAccount>;

const GRAPH_REDUCER_ACTION_TYPES = [
    ...Object.values(GRAPH),
    STORAGE.LOAD,
    accountsActions.removeAccount.type,
] as const satisfies GraphReducerAction['type'][];

const isGraphReducerAction = (action: ReduxAction): action is GraphReducerAction =>
    isArrayMember(action.type, GRAPH_REDUCER_ACTION_TYPES);

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

const update = (draft: GraphState, payload: GraphData) => {
    const { account, data, error, isLoading } = payload;
    const dataIndex = draft.data.findIndex(
        d =>
            d.account.deviceState === account.deviceState &&
            d.account.descriptor === account.descriptor &&
            d.account.symbol === account.symbol,
    );
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

const graphReducer = (state: GraphState = initialState, action: ReduxAction): GraphState => {
    if (!isGraphReducerAction(action)) {
        return state;
    }

    const graphAction: GraphReducerAction = action;

    return produce(state, draft => {
        switch (graphAction.type) {
            case STORAGE.LOAD:
                loadFromStorage(draft, graphAction.payload.graph);
                break;
            case GRAPH.ACCOUNT_GRAPH_START:
                update(draft, graphAction.payload);
                break;
            case GRAPH.ACCOUNT_GRAPH_SUCCESS:
                update(draft, graphAction.payload);
                break;
            case GRAPH.ACCOUNT_GRAPH_FAIL:
                update(draft, graphAction.payload);
                break;
            case GRAPH.AGGREGATED_GRAPH_START:
                draft.isLoading = true;
                break;
            case GRAPH.AGGREGATED_GRAPH_SUCCESS:
                draft.isLoading = false;
                break;
            case GRAPH.SET_SELECTED_RANGE:
                draft.selectedRange = graphAction.payload;
                break;
            case accountsActions.removeAccount.type: {
                if (accountsActions.removeAccount.match(graphAction)) {
                    remove(draft, graphAction.payload);
                }
                break;
            }
            // no default
        }
    });
};

export default graphReducer;

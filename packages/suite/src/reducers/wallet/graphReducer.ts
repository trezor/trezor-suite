import type { UnknownAction } from '@reduxjs/toolkit';
import { produce } from 'immer';

import { accountsActions } from '@suite-common/wallet-core';

import { storageLoad } from 'src/actions/suite/storageLifecycleActions';
import {
    accountGraphFail,
    accountGraphStart,
    accountGraphSuccess,
    aggregatedGraphStart,
    aggregatedGraphSuccess,
    setSelectedRange,
} from 'src/actions/wallet/graphActions';
import { SETTINGS } from 'src/config/suite';
import { type Account } from 'src/types/wallet';
import { type AccountIdentifier, type GraphData, type GraphRange } from 'src/types/wallet/graph';

export interface GraphState {
    data: GraphData[];
    error: null | AccountIdentifier[];
    isLoading: boolean;
    selectedRange: GraphRange;
}

export type GraphRootState = {
    wallet: {
        graph: GraphState;
    };
};

export const selectGraph = (state: GraphRootState) => state.wallet.graph;
export const selectGraphSelectedRange = (state: GraphRootState) => state.wallet.graph.selectedRange;

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

const graphReducer = (state: GraphState = initialState, action: UnknownAction): GraphState =>
    produce(state, draft => {
        if (storageLoad.match(action)) {
            loadFromStorage(draft, action.payload.graph);
        } else if (accountGraphStart.match(action) || accountGraphFail.match(action)) {
            updateProgress(draft, action.payload);
        } else if (accountGraphSuccess.match(action)) {
            update(draft, action.payload);
        } else if (aggregatedGraphStart.match(action)) {
            draft.isLoading = true;
        } else if (aggregatedGraphSuccess.match(action)) {
            draft.isLoading = false;
        } else if (setSelectedRange.match(action)) {
            draft.selectedRange = action.payload;
        } else if (accountsActions.removeAccount.match(action)) {
            remove(draft, action.payload);
        }
    });

export default graphReducer;

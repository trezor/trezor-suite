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
    error: boolean;
    isLoading: boolean;
    data: BlockchainAccountBalanceHistory[] | null;
}

interface State {
    data: GraphData[];
    error: null | AccountIdentifier[];
    isLoading: boolean;
    selectedRange: GraphRange;
}

const initialState: State = {
    data: [],
    selectedRange: SETTINGS.DEFAULT_GRAPH_RANGE,
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

const loadFromStorage = (draft: State, payload: GraphData[]) => {
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

export default (state: State = initialState, action: WalletAction | SuiteAction): State => {
    return produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOADED:
                loadFromStorage(draft, action.payload.wallet.graph.data);
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
            case ACCOUNT.REMOVE:
                return remove(draft, action.payload);
            // no default
        }
    });
};

import produce from 'immer';
import { BlockchainAccountBalanceHistory } from 'trezor-connect';
import { ACCOUNT, GRAPH } from '@wallet-actions/constants';
import { STORAGE } from '@suite-actions/constants';
import { WalletAction, Network, Account } from '@wallet-types';
import { Action as SuiteAction } from '@suite-types';
import { GraphRange } from '@suite/types/wallet/fiatRates';
// import { SETTINGS } from '@suite-config';

interface AccountIdentifier {
    descriptor: string;
    deviceState: string;
    symbol: Network['symbol'];
}

export interface GraphData {
    account: AccountIdentifier;
    interval: string;
    data: BlockchainAccountBalanceHistory[];
}

interface State {
    data: GraphData[];
    error: null | AccountIdentifier[];
    isLoading: boolean;
    // selectedRange: GraphRange;
}

const initialState: State = {
    data: [],
    error: null,
    isLoading: false,
    // selectedRange: SETTINGS.DEFAULT_GRAPH_RANGE,
};

const update = (
    draft: State,
    account: Account,
    data: BlockchainAccountBalanceHistory[],
    interval: GraphRange['label'],
) => {
    const dataIndex = draft.data.findIndex(
        d =>
            d.account.deviceState === account.deviceState &&
            d.account.descriptor === account.descriptor &&
            d.account.symbol === account.symbol &&
            d.interval === interval,
    );
    if (dataIndex !== -1) {
        draft.data[dataIndex].data = data;
    } else {
        draft.data.push({
            account: {
                deviceState: account.deviceState,
                descriptor: account.descriptor,
                symbol: account.symbol,
            },
            interval,
            data,
        });
    }
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
};

export default (state: State = initialState, action: WalletAction | SuiteAction): State => {
    return produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOADED:
                return action.payload.wallet.graph;
            case GRAPH.AGGREGATED_HISTORY_UPDATE:
                update(draft, action.payload.account, action.payload.data, action.payload.interval);
                break;
            case GRAPH.AGGREGATED_HISTORY_START:
                draft.isLoading = true;
                break;
            case GRAPH.AGGREGATED_HISTORY_SUCCESS:
                draft.isLoading = false;
                draft.error = null;
                break;
            case GRAPH.AGGREGATED_HISTORY_FAIL:
                draft.isLoading = false;
                draft.error = action.payload;
                break;
            // case ACCOUNT.UPDATE:
            //     update(draft, action.payload);
            //     break;
            case ACCOUNT.REMOVE:
                return remove(draft, action.payload);
            // no default
        }
    });
};

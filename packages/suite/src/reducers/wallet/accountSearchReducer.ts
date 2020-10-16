import produce from 'immer';
import { SUITE } from '@suite-actions/constants';
import { ACCOUNT_SEARCH } from '@wallet-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import { Action } from '@suite-types';
import { Account as AccountType } from '@wallet-types';

export interface State {
    coinFilter: AccountType['symbol'] | undefined;
    searchString: string | undefined;
}

export const initialState: State = {
    coinFilter: undefined,
    searchString: undefined,
};

const accountSearchReducer = (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case ACCOUNT_SEARCH.SET_SEARCH_STRING:
                draft.searchString = action.payload;
                break;
            case ACCOUNT_SEARCH.SET_COIN_FILTER:
                draft.coinFilter = action.payload;
                break;
            // reset coin filter on:
            // 1) disabling/enabling coins
            // 2) switching to another device/wallet
            // * 3) adding a new account is handled directly in add account modal, reacting on ACCOUNT.CREATE would cause resetting during initial accounts discovery
            case WALLET_SETTINGS.CHANGE_NETWORKS:
            case SUITE.SELECT_DEVICE:
                draft.coinFilter = undefined;
                draft.searchString = undefined;
                break;

            // no default
        }
    });
};

export default accountSearchReducer;

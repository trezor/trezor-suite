import produce from 'immer';
import { SUITE } from '@suite-actions/constants';
import { ACCOUNT_SEARCH, ACCOUNT } from '@wallet-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import { Action } from '@suite-types';
import { Account as AccountType } from '@wallet-types';

export interface State {
    coinFilter: AccountType['symbol'] | undefined;
}

export const initialState: State = {
    coinFilter: undefined,
};

const accountSearchReducer = (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case ACCOUNT_SEARCH.SET_COIN_FILTER:
                draft.coinFilter = action.payload;
                break;
            // reset coin filter on:
            // 1) disabling/enabling coins
            // 2) switching to another device/wallet
            // 3) adding a new account (this also causes resetting during initial discovery, but imo it's a feature enabling users to actually see new accounts being added to the list)
            case WALLET_SETTINGS.CHANGE_NETWORKS:
            case SUITE.SELECT_DEVICE:
            case ACCOUNT.CREATE:
                draft.coinFilter = undefined;
                break;

            // no default
        }
    });
};

export default accountSearchReducer;

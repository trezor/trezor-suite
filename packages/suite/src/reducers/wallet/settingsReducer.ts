import produce from 'immer';
import { SETTINGS } from '@wallet-actions/constants';
import { WalletActions } from '@suite-types/index';

export interface State {
    localCurrency: string;
    hideBalance: boolean;
    hiddenCoins: string[];
    hiddenCoinsExternal: string[];
}

export const initialState: State = {
    localCurrency: 'usd',
    hideBalance: false,
    hiddenCoins: [],
    hiddenCoinsExternal: [],
};

export default (state: State = initialState, action: WalletActions): State => {
    return produce(state, draft => {
        switch (action.type) {
            case SETTINGS.SET_LOCAL_CURRENCY:
                draft.localCurrency = action.localCurrency;
                break;

            case SETTINGS.SET_HIDE_BALANCE:
                draft.hideBalance = action.toggled;
                break;

            case SETTINGS.SET_HIDDEN_COINS:
                draft.hiddenCoins = action.hiddenCoins;
                break;

            case SETTINGS.SET_HIDDEN_COINS_EXTERNAL:
                draft.hiddenCoinsExternal = action.hiddenCoinsExternal;
                break;

            case SETTINGS.FROM_STORAGE:
                return action.payload;
            // no default
        }
    });
};

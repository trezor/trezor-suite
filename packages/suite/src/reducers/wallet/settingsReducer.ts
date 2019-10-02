import produce from 'immer';
import { STORAGE } from '@suite-actions/constants';
import { SETTINGS } from '@wallet-actions/constants';
import { Action } from '@suite-types';
import { EXTERNAL_NETWORKS } from '@suite-config';

export interface State {
    localCurrency: string;
    hideBalance: boolean;
    enabledNetworks: string[];
    enabledExternalNetworks: string[];
}

export const initialState: State = {
    localCurrency: 'usd',
    hideBalance: false,
    enabledNetworks: ['btc', 'test'],
    enabledExternalNetworks: EXTERNAL_NETWORKS.filter(n => !n.isHidden).map(n => n.symbol),
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOADED:
                return action.payload.wallet.settings;

            case SETTINGS.SET_LOCAL_CURRENCY:
                draft.localCurrency = action.localCurrency;
                break;

            case SETTINGS.SET_HIDE_BALANCE:
                draft.hideBalance = action.toggled;
                break;

            case SETTINGS.CHANGE_NETWORKS:
                draft.enabledNetworks = action.payload;
                break;

            case SETTINGS.CHANGE_EXTERNAL_NETWORKS:
                draft.enabledExternalNetworks = action.payload;
                break;
            // no default
        }
    });
};

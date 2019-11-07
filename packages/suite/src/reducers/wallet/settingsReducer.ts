import produce from 'immer';
import { STORAGE } from '@suite-actions/constants';
import { SETTINGS } from '@wallet-actions/constants';
import { EXTERNAL_NETWORKS } from '@wallet-config';
import { Action } from '@suite-types';
import { Network, ExternalNetwork } from '@suite/types/wallet';

export interface State {
    localCurrency: string;
    hideBalance: boolean;
    enabledNetworks: Network['symbol'][];
    enabledExternalNetworks: ExternalNetwork['symbol'][];
}

export const initialState: State = {
    localCurrency: 'usd',
    hideBalance: false,
    enabledNetworks: ['btc'],
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

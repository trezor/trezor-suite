import produce from 'immer';
import { STORAGE } from '@suite-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import { EXTERNAL_NETWORKS } from '@wallet-config';
import { Action } from '@suite-types';
import { Network, ExternalNetwork } from '@wallet-types';

export interface State {
    localCurrency: string;
    discreetMode: boolean;
    enabledNetworks: Network['symbol'][];
    enabledExternalNetworks: ExternalNetwork['symbol'][];
}

export const initialState: State = {
    localCurrency: 'usd',
    discreetMode: false,
    enabledNetworks: ['btc'],
    enabledExternalNetworks: EXTERNAL_NETWORKS.filter(n => !n.isHidden).map(n => n.symbol),
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOADED:
                return action.payload.wallet.settings;

            case WALLET_SETTINGS.SET_LOCAL_CURRENCY:
                draft.localCurrency = action.localCurrency;
                break;

            case WALLET_SETTINGS.SET_HIDE_BALANCE:
                draft.discreetMode = action.toggled;
                break;

            case WALLET_SETTINGS.CHANGE_NETWORKS:
                draft.enabledNetworks = action.payload;
                break;

            case WALLET_SETTINGS.CHANGE_EXTERNAL_NETWORKS:
                draft.enabledExternalNetworks = action.payload;
                break;
            // no default
        }
    });
};

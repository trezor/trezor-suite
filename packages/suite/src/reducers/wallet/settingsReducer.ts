import produce from 'immer';
import { FeeLevel } from 'trezor-connect';
import { STORAGE } from '@suite-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import { Action } from '@suite-types';
import { Network } from '@wallet-types';

export type BackendType = 'blockbook' | 'electrum' | 'ripple';

export type BackendSettings = {
    coin: Network['symbol'];
    type: BackendType;
    urls: string[];
    tor?: boolean; // Added by TOR
};

type Backends = {
    [coin in BackendSettings['coin']]: Omit<BackendSettings, 'coin'>;
};

export interface State {
    localCurrency: string;
    discreetMode: boolean;
    enabledNetworks: Network['symbol'][];
    lastUsedFeeLevel: {
        [key: string]: Omit<FeeLevel, 'blocks'>; // Key: Network['symbol']
    };
    backends: Partial<Backends>;
}

export const initialState: State = {
    localCurrency: 'usd',
    discreetMode: false,
    enabledNetworks: ['btc'],
    lastUsedFeeLevel: {},
    backends: {},
};

const settingsReducer = (state: State = initialState, action: Action): State =>
    produce(state, draft => {
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

            case WALLET_SETTINGS.SET_LAST_USED_FEE_LEVEL:
                if (action.feeLevel) {
                    draft.lastUsedFeeLevel[action.symbol] = action.feeLevel;
                } else {
                    delete draft.lastUsedFeeLevel[action.symbol];
                }
                break;

            case WALLET_SETTINGS.SET_BACKEND: {
                const { coin, type, urls, tor } = action.payload;
                if (!urls.length) {
                    delete draft.backends[coin];
                } else {
                    draft.backends[coin] = {
                        type,
                        urls,
                        tor,
                    };
                }
                break;
            }

            case WALLET_SETTINGS.REMOVE_BACKEND:
                delete draft.backends[action.payload.coin];
                break;

            // no default
        }
    });

export default settingsReducer;

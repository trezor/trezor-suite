import produce from 'immer';
import { FeeLevel } from 'trezor-connect';
import { STORAGE } from '@suite-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import { EXTERNAL_NETWORKS } from '@wallet-config';
import { Action } from '@suite-types';
import { Network, ExternalNetwork } from '@wallet-types';
import { BlockbookUrl } from '@wallet-types/blockbook';

export interface State {
    localCurrency: string;
    discreetMode: boolean;
    enabledNetworks: Network['symbol'][];
    enabledExternalNetworks: ExternalNetwork['symbol'][];
    lastUsedFeeLevel: {
        [key: string]: Omit<FeeLevel, 'blocks'>; // Key: Network['symbol']
    };
    blockbookUrls: BlockbookUrl[];
}

export const initialState: State = {
    localCurrency: 'usd',
    discreetMode: false,
    enabledNetworks: ['btc'],
    enabledExternalNetworks: EXTERNAL_NETWORKS.filter(n => !n.isHidden).map(n => n.symbol),
    lastUsedFeeLevel: {},
    blockbookUrls: [],
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

            case WALLET_SETTINGS.SET_LAST_USED_FEE_LEVEL:
                if (action.feeLevel) {
                    draft.lastUsedFeeLevel[action.symbol] = action.feeLevel;
                } else {
                    delete draft.lastUsedFeeLevel[action.symbol];
                }
                break;

            case WALLET_SETTINGS.ADD_BLOCKBOOK_URL:
                draft.blockbookUrls.push(action.payload);
                break;

            case WALLET_SETTINGS.REMOVE_BLOCKBOOK_URL: {
                const { coin, url } = action.payload;
                const index = draft.blockbookUrls.findIndex(b => b.coin !== coin && b.url !== url);
                draft.blockbookUrls.splice(index, 1);
                break;
            }

            // no default
        }
    });
};

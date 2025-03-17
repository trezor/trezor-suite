import { produce } from 'immer';

import { networkSymbolCollection } from '@suite-common/wallet-config';
import type { WalletSettings } from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';

import { WALLET_SETTINGS } from 'src/actions/settings/constants';
import * as walletSettingsActions from 'src/actions/settings/walletSettingsActions';
import { STORAGE } from 'src/actions/suite/constants';
import type { Action, AppState } from 'src/types/suite';

export type State = WalletSettings;

export const initialState: State = {
    localCurrency: 'usd',
    discreetMode: false,
    enabledNetworks: ['btc'],
    hideSuspiciousTransactions: false,
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
};

const settingsReducer = (state: State = initialState, action: Action): State =>
    produce(state, draft => {
        switch (action.type) {
            case STORAGE.LOAD:
                return action.payload.walletSettings || state;
            case walletSettingsActions.setLocalCurrency.type: {
                if (walletSettingsActions.setLocalCurrency.match(action)) {
                    const { localCurrency } = action.payload;
                    draft.localCurrency = localCurrency;
                }
                break;
            }
            case WALLET_SETTINGS.SET_HIDE_BALANCE:
                draft.discreetMode = action.toggled;
                break;

            case walletSettingsActions.changeNetworks.type: {
                if (walletSettingsActions.changeNetworks.match(action)) {
                    draft.enabledNetworks = [...action.payload].sort(
                        (a, b) =>
                            networkSymbolCollection.indexOf(a) - networkSymbolCollection.indexOf(b),
                    );
                }
                break;
            }

            case WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS:
                draft.bitcoinAmountUnit = action.payload;
                break;

            case WALLET_SETTINGS.TOGGLE_HIDE_SUSPICIOUS_TRANSACTIONS:
                draft.hideSuspiciousTransactions = !draft.hideSuspiciousTransactions;
                break;

            // no default
        }
    });

export const selectEnabledNetworks = (state: AppState) => state.wallet.settings.enabledNetworks;
export const selectLocalCurrency = (state: AppState) => state.wallet.settings.localCurrency;
export const selectIsDiscreteModeActive = (state: AppState) => state.wallet.settings.discreetMode;
export const selectIsHideSuspiciousTransactions = (state: AppState) =>
    state.wallet.settings.hideSuspiciousTransactions;
export const selectBitcoinAmountUnit = (state: AppState) => state.wallet.settings.bitcoinAmountUnit;

export const selectAreSatsAmountUnit = (state: AppState) => {
    const bitcoinAmountUnit = selectBitcoinAmountUnit(state);

    return bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;
};
export default settingsReducer;

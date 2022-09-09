import { WalletSettings } from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';
import { createReducerWithExtraDeps } from '@suite-common/redux-utils';

import { settingsActions } from './settingsActions';

export type WalletSettingsState = WalletSettings;

export const walletSettingsInitialState: WalletSettingsState = {
    localCurrency: 'usd',
    discreetMode: false,
    enabledNetworks: ['btc'],
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    lastUsedFeeLevel: {},
};

export type WalletSettingsRootState = {
    wallet: {
        settings: WalletSettingsState;
    };
};

export const prepareWalletSettingsReducer = createReducerWithExtraDeps(
    walletSettingsInitialState,
    (builder, extra) => {
        builder
            .addCase(settingsActions.setLocalCurrency, (state, { payload }) => {
                const { localCurrency } = payload;
                state.localCurrency = localCurrency;
            })
            .addCase(settingsActions.setHideBalance, (state, { payload }) => {
                const { toggled } = payload;
                state.discreetMode = toggled;
            })
            .addCase(settingsActions.changeNetworks, (state, { payload }) => {
                state.enabledNetworks = payload;
            })
            .addCase(settingsActions.setLastUsedFeeLevel, (state, { payload }) => {
                const { feeLevel, symbol } = payload;
                if (feeLevel) {
                    state.lastUsedFeeLevel[symbol] = feeLevel;
                } else {
                    delete state.lastUsedFeeLevel[symbol];
                }
            })
            .addCase(settingsActions.setBitcoinAmountUnits, (state, { payload }) => {
                /*
    analytics.report({
        type: EventType.SettingsGeneralChangeBitcoinUnit,
        payload: {
            unit: UNIT_ABBREVIATIONS[units],
        },
    });
                 */
                const { units } = payload;
                state.bitcoinAmountUnit = units;
            })
            .addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadWalletSettings);
    },
);

export const selectEnabledNetworks = (state: WalletSettingsRootState) =>
    state.wallet.settings.enabledNetworks;
export const selectCurrentBitcoinUnits = (state: WalletSettingsRootState) =>
    state.wallet.settings.bitcoinAmountUnit;

export const selectLastUsedFeeLevel = (state: WalletSettingsRootState) =>
    state.wallet.settings.lastUsedFeeLevel;

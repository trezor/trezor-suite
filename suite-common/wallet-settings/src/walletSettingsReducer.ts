import { createReducerWithExtraDeps, returnStableArrayIfEmpty } from '@suite-common/redux-utils';
import { NetworkSymbol, getNetwork, networkSymbolCollection } from '@suite-common/wallet-config';
import type { WalletSettings } from '@suite-common/wallet-types';
import { PROTO } from '@trezor/connect';
import { isNative } from '@trezor/env-utils';

import * as walletSettingsActions from './walletSettingsActions';
import { WALLET_SETTINGS } from './walletSettingsConstants';

export type State = WalletSettings;

export type WalletSettingsRootState = {
    wallet: {
        settings: State;
    };
};

const initialState: State = {
    localCurrency: 'usd',
    discreetMode: false,
    // Suite Lite did not have BTC enabled by default
    enabledNetworks: isNative() ? [] : ['btc'],
    hideSuspiciousTransactions: false,
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
};
export const initialWalletSettingsState: State = initialState;

export const walletSettingsPersistedWhitelist: Array<keyof State> = [
    'localCurrency',
    'discreetMode',
    'enabledNetworks',
    'hideSuspiciousTransactions',
    'bitcoinAmountUnit',
];

export const prepareWalletSettingsReducer = createReducerWithExtraDeps(
    initialState,
    (builder, extra) => {
        builder.addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadWalletSettings);
        builder.addCase(
            walletSettingsActions.setLocalCurrency.type,
            (state, action: ReturnType<typeof walletSettingsActions.setLocalCurrency>) => {
                const { localCurrency } = action.payload;
                state.localCurrency = localCurrency;
            },
        );
        builder.addCase(
            WALLET_SETTINGS.SET_HIDE_BALANCE,
            (state, action: walletSettingsActions.SetHideBalanceAction) => {
                state.discreetMode = action.toggled;
            },
        );
        builder.addCase(
            walletSettingsActions.changeNetworks.type,
            (state, action: ReturnType<typeof walletSettingsActions.changeNetworks>) => {
                state.enabledNetworks = [...action.payload].sort(
                    (a, b) =>
                        networkSymbolCollection.indexOf(a) - networkSymbolCollection.indexOf(b),
                );
            },
        );
        builder.addCase(
            WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS,
            (state, action: walletSettingsActions.SetBitcoinAmountUnitsAction) => {
                state.bitcoinAmountUnit = action.payload;
            },
        );
        builder.addCase(WALLET_SETTINGS.TOGGLE_HIDE_SUSPICIOUS_TRANSACTIONS, state => {
            state.hideSuspiciousTransactions = !state.hideSuspiciousTransactions;
        });
    },
);

export const selectEnabledNetworks = (state: WalletSettingsRootState) =>
    returnStableArrayIfEmpty(state.wallet.settings.enabledNetworks);
export const selectLocalCurrency = (state: WalletSettingsRootState) =>
    state.wallet.settings.localCurrency;
export const selectIsDiscreteModeActive = (state: WalletSettingsRootState) =>
    state.wallet.settings.discreetMode;
export const selectIsHideSuspiciousTransactions = (state: WalletSettingsRootState) =>
    state.wallet.settings.hideSuspiciousTransactions;
export const selectBitcoinAmountUnit = (state: WalletSettingsRootState) =>
    state.wallet.settings.bitcoinAmountUnit;

export const selectAreSatsAmountUnit = (state: WalletSettingsRootState) => {
    const bitcoinAmountUnit = selectBitcoinAmountUnit(state);

    return bitcoinAmountUnit === PROTO.AmountUnit.SATOSHI;
};

export const selectIsAmountInSats = (
    state: WalletSettingsRootState,
    symbol: NetworkSymbol | null | undefined,
) => {
    if (!symbol) {
        return false;
    }

    const network = getNetwork(symbol);
    const isAmountUnitSupported = network && network.features.includes('amount-unit');

    return isAmountUnitSupported && selectAreSatsAmountUnit(state);
};

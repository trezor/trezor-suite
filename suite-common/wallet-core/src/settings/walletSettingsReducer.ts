import { A } from '@mobily/ts-belt';

import {
    createReducerWithExtraDeps,
    createWeakMapSelector,
    returnStableArrayIfEmpty,
} from '@suite-common/redux-utils';
import { NETWORKS_WITH_DUST_PHISHING_DETECTION } from '@suite-common/token-definitions';
import {
    type NetworkSymbol,
    getNetwork,
    getNetworkType,
    networkSymbolCollection,
} from '@suite-common/wallet-config';
import type { WalletSettings } from '@suite-common/wallet-types';
import { isBaseCurrencyWithSats } from '@suite-common/wallet-utils';
import { PROTO } from '@trezor/connect';

import * as walletSettingsActions from './walletSettingsActions';
import { WALLET_SETTINGS } from './walletSettingsConstants';

export type WalletSettingsState = WalletSettings;

export type WalletSettingsRootState = {
    wallet: {
        settings: WalletSettingsState;
    };
};

export const createMemoizedSelector = createWeakMapSelector.withTypes<WalletSettingsRootState>();

const initialState: WalletSettingsState = {
    localCurrency: 'usd',
    discreetMode: false,
    enabledNetworks: [],
    hideSuspiciousTransactions: false,
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    mevProtection: true,
    networkReserve: true,
    isAutoEjectEnabled: false,
};
export const initialWalletSettingsState: WalletSettingsState = initialState;

export const walletSettingsPersistedWhitelist: Array<keyof WalletSettingsState> = [
    'localCurrency',
    'discreetMode',
    'enabledNetworks',
    'hideSuspiciousTransactions',
    'bitcoinAmountUnit',
    'mevProtection',
    'networkReserve',
    'isAutoEjectEnabled',
];

export const prepareWalletSettingsReducer = createReducerWithExtraDeps(
    initialState,
    (builder, extra) => {
        builder.addCase(extra.actionTypes.storageLoad, extra.reducers.storageLoadWalletSettings);
        builder.addCase(
            walletSettingsActions.setBaseCurrency.type,
            (state, action: ReturnType<typeof walletSettingsActions.setBaseCurrency>) => {
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
        builder.addCase(
            WALLET_SETTINGS.SET_MEV_PROTECTION,
            (state, action: ReturnType<typeof walletSettingsActions.setMevProtection>) => {
                state.mevProtection = action.payload;
            },
        );
        builder.addCase(
            WALLET_SETTINGS.SET_NETWORK_RESERVE,
            (state, action: ReturnType<typeof walletSettingsActions.setNetworkReserve>) => {
                state.networkReserve = action.payload;
            },
        );
        builder.addCase(WALLET_SETTINGS.TOGGLE_HIDE_SUSPICIOUS_TRANSACTIONS, state => {
            state.hideSuspiciousTransactions = !state.hideSuspiciousTransactions;
        });
        builder.addCase(
            WALLET_SETTINGS.SET_AUTO_EJECT,
            (state, action: ReturnType<typeof walletSettingsActions.setAutoEjectEnabled>) => {
                state.isAutoEjectEnabled = action.payload;
            },
        );
    },
);

export const selectEnabledNetworks = (state: WalletSettingsRootState) =>
    returnStableArrayIfEmpty(state.wallet.settings.enabledNetworks);
export const selectBaseCurrency = (state: WalletSettingsRootState) =>
    state.wallet.settings.localCurrency;
export const selectIsDiscreteModeActive = (state: WalletSettingsRootState) =>
    state.wallet.settings.discreetMode;
export const selectIsHideSuspiciousTransactions = (state: WalletSettingsRootState) =>
    state.wallet.settings.hideSuspiciousTransactions;
export const selectBitcoinAmountUnit = (state: WalletSettingsRootState) =>
    state.wallet.settings.bitcoinAmountUnit;
export const selectIsDeviceAutoEjectEnabled = (state: WalletSettingsRootState) =>
    state.wallet.settings.isAutoEjectEnabled;

export const selectIsAnyNetworkEnabled = (state: WalletSettingsRootState) =>
    A.isNotEmpty(selectEnabledNetworks(state));

export const selectIsBitcoinEnabled = createMemoizedSelector(
    [selectEnabledNetworks],
    enabledNetworks => enabledNetworks.includes('btc'),
);

export const selectIsAnyNonBitcoinLikeNetworkEnabled = createMemoizedSelector(
    [selectEnabledNetworks],
    enabledNetworks => enabledNetworks.some(network => getNetworkType(network) !== 'bitcoin'),
);

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

export const selectIsBaseCurrencyInSats = (state: WalletSettingsRootState) => {
    const areSatsAmountUnit = selectAreSatsAmountUnit(state);
    const baseCurrency = selectBaseCurrency(state);

    return isBaseCurrencyWithSats(baseCurrency) && areSatsAmountUnit;
};

export const selectIsNetworkReserveEnabled = (state: WalletSettingsRootState) =>
    state.wallet.settings.networkReserve;

// Selects the primitive value in walletSettings, see @suite-common/mev for the derived selectors
export const selectIsMevProtectionEnabled = (state: WalletSettingsRootState) =>
    state.wallet.settings.mevProtection;

export const selectIsNetworkReserveSettingsVisible = createMemoizedSelector(
    [selectEnabledNetworks],
    enabledNetworks =>
        enabledNetworks.some(enabledNetwork => !!getNetwork(enabledNetwork)?.nativeTokenReserve),
);

export const selectIsDustPhishingThresholdSettingsVisible = createMemoizedSelector(
    [selectEnabledNetworks],
    enabledNetworks =>
        enabledNetworks.some(enabledNetwork =>
            NETWORKS_WITH_DUST_PHISHING_DETECTION.includes(getNetworkType(enabledNetwork)),
        ),
);

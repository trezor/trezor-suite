import { A } from '@mobily/ts-belt';

import { type DeviceRootState, selectHasBitcoinOnlyFirmware } from '@suite-common/device';
import {
    createReducerWithExtraDeps,
    createWeakMapSelector,
    returnStableArrayIfEmpty,
} from '@suite-common/redux-utils';
import {
    type NetworkSymbol,
    getNetwork,
    networkSymbolCollection,
} from '@suite-common/wallet-config';
import { AddressDisplayOptions, type WalletSettings } from '@suite-common/wallet-types';
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
    enabledNetworks: ['btc'], // Suite Dark flavour: Bitcoin-only default
    hideSuspiciousTransactions: {},
    bitcoinAmountUnit: PROTO.AmountUnit.BITCOIN,
    mevProtection: true,
    networkReserve: true,
    isAutoEjectEnabled: false,
    addressDisplayType: AddressDisplayOptions.CHUNKED,
};
export const initialWalletSettingsState: WalletSettingsState = initialState;

export const walletSettingsPersistedWhitelist: Array<keyof WalletSettingsState> = [
    'localCurrency',
    'enabledNetworks',
    'hideSuspiciousTransactions',
    'bitcoinAmountUnit',
    'mevProtection',
    'networkReserve',
    'isAutoEjectEnabled',
    'addressDisplayType',
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
        builder.addCase(
            WALLET_SETTINGS.TOGGLE_HIDE_SUSPICIOUS_TRANSACTIONS,
            (
                state,
                action: ReturnType<typeof walletSettingsActions.toggleHideSuspiciousTransactions>,
            ) => {
                const symbol = action.payload;
                state.hideSuspiciousTransactions[symbol] =
                    !state.hideSuspiciousTransactions[symbol];
            },
        );
        builder.addCase(
            WALLET_SETTINGS.SET_AUTO_EJECT,
            (state, action: ReturnType<typeof walletSettingsActions.setAutoEjectEnabled>) => {
                state.isAutoEjectEnabled = action.payload;
            },
        );
        builder.addCase(
            WALLET_SETTINGS.SET_ADDRESS_DISPLAY_TYPE,
            (state, action: ReturnType<typeof walletSettingsActions.setAddressDisplayType>) => {
                state.addressDisplayType = action.payload;
            },
        );
    },
);

export const selectEnabledNetworks = (state: WalletSettingsRootState) =>
    returnStableArrayIfEmpty(state.wallet.settings.enabledNetworks);
export const selectBaseCurrency = (state: WalletSettingsRootState) =>
    state.wallet.settings.localCurrency;
export const selectIsHideSuspiciousTransactions = (
    state: WalletSettingsRootState,
    symbol: NetworkSymbol,
) => Boolean(state.wallet.settings.hideSuspiciousTransactions[symbol]);
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
    const isAmountUnitSupported = network?.features.includes('amount-unit');

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

export const selectIsNetworkReserveSettingsVisible = (state: DeviceRootState) =>
    !selectHasBitcoinOnlyFirmware(state);

export const selectAddressDisplayType = (state: WalletSettingsRootState) =>
    state.wallet.settings.addressDisplayType;

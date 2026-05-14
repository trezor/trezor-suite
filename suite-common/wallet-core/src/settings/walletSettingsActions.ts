import { createAction } from '@reduxjs/toolkit';

import { type NetworkSymbol } from '@suite-common/wallet-config';
import { type AddressDisplayOptions } from '@suite-common/wallet-types';
import type { BaseCurrencyCode } from '@trezor/blockchain-link-types';
import { type PROTO } from '@trezor/connect';

import { WALLET_SETTINGS } from './walletSettingsConstants';

export const setBaseCurrency = createAction(
    WALLET_SETTINGS.SET_BASE_CURRENCY,
    (baseCurrencyCode: BaseCurrencyCode) => ({
        payload: {
            localCurrency: baseCurrencyCode.toLowerCase() as BaseCurrencyCode,
        },
    }),
);

export const changeNetworks = createAction(
    WALLET_SETTINGS.CHANGE_NETWORKS,
    (payload: NetworkSymbol[]) => ({
        payload,
    }),
);

export const setMevProtection = createAction(
    WALLET_SETTINGS.SET_MEV_PROTECTION,
    (enabled: boolean) => ({
        payload: enabled,
    }),
);

export const setNetworkReserve = createAction(
    WALLET_SETTINGS.SET_NETWORK_RESERVE,
    (enabled: boolean) => ({ payload: enabled }),
);

export const toggleHideSuspiciousTransactions = createAction(
    WALLET_SETTINGS.TOGGLE_HIDE_SUSPICIOUS_TRANSACTIONS,
);

export const setAutoEjectEnabled = createAction(
    WALLET_SETTINGS.SET_AUTO_EJECT,
    (enabled: boolean) => ({ payload: enabled }),
);

export const setAddressDisplayType = createAction(
    WALLET_SETTINGS.SET_ADDRESS_DISPLAY_TYPE,
    (value: AddressDisplayOptions) => ({ payload: value }),
);

export type ChangeCoinVisibilityAction = {
    type: typeof WALLET_SETTINGS.CHANGE_COIN_VISIBILITY;
    payload: {
        symbol: NetworkSymbol;
        shouldBeVisible: boolean;
    };
};

export type SetHideBalanceAction = {
    type: typeof WALLET_SETTINGS.SET_HIDE_BALANCE;
    toggled: boolean;
};

export type SetBitcoinAmountUnitsAction = {
    type: typeof WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS;
    payload: PROTO.AmountUnit;
};

export type WalletSettingsAction =
    | ReturnType<typeof changeNetworks>
    | ReturnType<typeof setBaseCurrency>
    | ReturnType<typeof toggleHideSuspiciousTransactions>
    | ReturnType<typeof setAutoEjectEnabled>
    | ReturnType<typeof setMevProtection>
    | ReturnType<typeof setNetworkReserve>
    | ReturnType<typeof setAddressDisplayType>
    | ChangeCoinVisibilityAction
    | SetHideBalanceAction
    | SetBitcoinAmountUnitsAction;

export const setDiscreetMode = (toggled: boolean): SetHideBalanceAction => ({
    type: WALLET_SETTINGS.SET_HIDE_BALANCE,
    toggled,
});

export const setBitcoinAmountUnits = (units: PROTO.AmountUnit): SetBitcoinAmountUnitsAction => ({
    type: WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS,
    payload: units,
});

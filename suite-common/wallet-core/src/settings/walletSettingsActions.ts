import { Dispatch, createAction } from '@reduxjs/toolkit';

import { FiatCurrencyCode } from '@suite-common/suite-config';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { PROTO } from '@trezor/connect';

import { WALLET_SETTINGS } from './walletSettingsConstants';
import { selectBitcoinAmountUnit } from './walletSettingsReducer';

export const setLocalCurrency = createAction(
    WALLET_SETTINGS.SET_LOCAL_CURRENCY,
    (localCurrency: string) => ({
        payload: {
            localCurrency: localCurrency.toLowerCase() as FiatCurrencyCode,
        },
    }),
);

export const changeNetworks = createAction(
    WALLET_SETTINGS.CHANGE_NETWORKS,
    (payload: NetworkSymbol[]) => ({
        payload,
    }),
);

export const toggleHideSuspiciousTransactions = createAction(
    WALLET_SETTINGS.TOGGLE_HIDE_SUSPICIOUS_TRANSACTIONS,
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
    | ReturnType<typeof setLocalCurrency>
    | ReturnType<typeof toggleHideSuspiciousTransactions>
    | ChangeCoinVisibilityAction
    | SetHideBalanceAction
    | SetBitcoinAmountUnitsAction;

export const setDiscreetMode = (toggled: boolean): WalletSettingsAction => ({
    type: WALLET_SETTINGS.SET_HIDE_BALANCE,
    toggled,
});

export const setBitcoinAmountUnits = (units: PROTO.AmountUnit): WalletSettingsAction => ({
    type: WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS,
    payload: units,
});

export const toggleBitcoinAmountUnits = () => (dispatch: Dispatch, getState: () => any) => {
    const currentUnits = selectBitcoinAmountUnit(getState());

    const nextUnits =
        currentUnits === PROTO.AmountUnit.BITCOIN
            ? PROTO.AmountUnit.SATOSHI
            : PROTO.AmountUnit.BITCOIN;

    dispatch(setBitcoinAmountUnits(nextUnits));
};

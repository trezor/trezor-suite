import { Dispatch, createAction } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { FiatCurrencyCode } from '@suite-common/suite-config';
import { NetworkSymbol } from '@suite-common/wallet-config';
import { PROTO } from '@trezor/connect';

import { WALLET_SETTINGS } from './walletSettingsConstants';
import { selectBitcoinAmountUnit, selectEnabledNetworks } from './walletSettingsReducer';
import { selectAccountsToBeForgotten } from '../discovery/discoveryReducer';
import { accountsActions } from '../accounts/accountsActions';

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

export const changeCoinVisibility = createThunk<
    void,
    {
        symbol: NetworkSymbol;
        shouldBeVisible: boolean;
    },
    void
>(WALLET_SETTINGS.CHANGE_COIN_VISIBILITY, ({ symbol, shouldBeVisible }, { dispatch, getState }) => {
    let enabledNetworks = selectEnabledNetworks(getState());
    const isAlreadyHidden = enabledNetworks.find(enabledSymbol => enabledSymbol === symbol);
    if (!shouldBeVisible) {
        enabledNetworks = enabledNetworks.filter(enabledSymbol => enabledSymbol !== symbol);
    } else if (!isAlreadyHidden) {
        enabledNetworks = [...enabledNetworks, symbol];
    }
    dispatch(changeNetworks(enabledNetworks));

    const accountsToRemove = selectAccountsToBeForgotten(getState());
    if (accountsToRemove.length > 0) {
        dispatch(accountsActions.removeAccount(accountsToRemove));
    }

    // this seems to be only for analyticsMiddleware
    dispatch({
        type: WALLET_SETTINGS.CHANGE_COIN_VISIBILITY,
        payload: {
            symbol,
            shouldBeVisible,
        },
    });
});

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

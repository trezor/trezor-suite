import { analytics, EventType } from '@trezor/suite-analytics';
import { FeeLevel, PROTO } from '@trezor/connect';
import * as suiteActions from '@suite-actions/suiteActions';
import { Dispatch, GetState } from '@suite-types';
import type { Network } from '@wallet-types';
import { WALLET_SETTINGS } from './constants';

export type WalletSettingsAction =
    | { type: typeof WALLET_SETTINGS.CHANGE_NETWORKS; payload: Network['symbol'][] }
    | { type: typeof WALLET_SETTINGS.SET_LOCAL_CURRENCY; localCurrency: string }
    | { type: typeof WALLET_SETTINGS.SET_HIDE_BALANCE; toggled: boolean }
    | {
          type: typeof WALLET_SETTINGS.SET_LAST_USED_FEE_LEVEL;
          symbol: Network['symbol'];
          feeLevel?: FeeLevel;
      }
    | {
          type: typeof WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS;
          payload: PROTO.AmountUnit;
      };

export const setLocalCurrency = (localCurrency: string): WalletSettingsAction => ({
    type: WALLET_SETTINGS.SET_LOCAL_CURRENCY,
    localCurrency: localCurrency.toLowerCase(),
});

export const setDiscreetMode = (toggled: boolean) => (dispatch: Dispatch, getState: GetState) => {
    dispatch({
        type: WALLET_SETTINGS.SET_HIDE_BALANCE,
        toggled,
    });
    if (!getState().suite.flags.discreetModeCompleted) {
        dispatch(suiteActions.setFlag('discreetModeCompleted', true));
    }

    analytics.report({
        type: EventType.MenuToggleDiscreet,
        payload: {
            value: toggled,
        },
    });
};

export const changeCoinVisibility =
    (symbol: Network['symbol'], shouldBeVisible: boolean) =>
    (dispatch: Dispatch, getState: GetState) => {
        let { enabledNetworks } = getState().wallet.settings;
        const isAlreadyHidden = enabledNetworks.find(coin => coin === symbol);
        if (!shouldBeVisible) {
            enabledNetworks = enabledNetworks.filter(coin => coin !== symbol);
        } else if (!isAlreadyHidden) {
            enabledNetworks = [...enabledNetworks, symbol];
        }
        dispatch({
            type: WALLET_SETTINGS.CHANGE_NETWORKS,
            payload: enabledNetworks,
        });

        analytics.report({
            type: EventType.SettingsCoins,
            payload: {
                symbol,
                value: shouldBeVisible,
            },
        });
    };

export const changeNetworks = (payload: Network['symbol'][]): WalletSettingsAction => ({
    type: WALLET_SETTINGS.CHANGE_NETWORKS,
    payload,
});

export const setLastUsedFeeLevel =
    (feeLevel?: FeeLevel) => (dispatch: Dispatch, getState: GetState) => {
        const { selectedAccount } = getState().wallet;
        if (selectedAccount.status !== 'loaded') return;
        dispatch({
            type: WALLET_SETTINGS.SET_LAST_USED_FEE_LEVEL,
            symbol: selectedAccount.account.symbol,
            feeLevel,
        });
    };

export const getLastUsedFeeLevel = () => (_: Dispatch, getState: GetState) => {
    const { selectedAccount, settings } = getState().wallet;
    if (selectedAccount.status !== 'loaded') return;
    return settings.lastUsedFeeLevel[selectedAccount.account.symbol];
};

export const setBitcoinAmountUnits = (units: PROTO.AmountUnit): WalletSettingsAction => ({
    type: WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS,
    payload: units,
});

export const toggleBitcoinAmountUnits = () => (dispatch: Dispatch, getState: GetState) => {
    const currentUnits = getState().wallet.settings.bitcoinAmountUnit;

    const nextUnits =
        currentUnits === PROTO.AmountUnit.BITCOIN
            ? PROTO.AmountUnit.SATOSHI
            : PROTO.AmountUnit.BITCOIN;

    dispatch(setBitcoinAmountUnits(nextUnits));
};

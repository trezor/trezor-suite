import * as suiteActions from 'src/actions/suite/suiteActions';
import { Dispatch, GetState } from 'src/types/suite';
import type { Network } from 'src/types/wallet';
import { createAction } from '@reduxjs/toolkit';

import { UNIT_ABBREVIATIONS } from '@suite-common/suite-constants';
import { FeeLevel, PROTO } from '@trezor/connect';
import { analytics, EventType } from '@trezor/suite-analytics';
import { FiatCurrencyCode } from '@suite-common/suite-config';

import { WALLET_SETTINGS } from './constants';

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
    (payload: Network['symbol'][]) => ({
        payload,
    }),
);

export type WalletSettingsAction =
    | ReturnType<typeof changeNetworks>
    | ReturnType<typeof setLocalCurrency>
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
        dispatch(changeNetworks(enabledNetworks));

        analytics.report({
            type: EventType.SettingsCoins,
            payload: {
                symbol,
                value: shouldBeVisible,
            },
        });
    };

export const setBitcoinAmountUnits = (units: PROTO.AmountUnit): WalletSettingsAction => {
    analytics.report({
        type: EventType.SettingsGeneralChangeBitcoinUnit,
        payload: {
            unit: UNIT_ABBREVIATIONS[units],
        },
    });

    return {
        type: WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS,
        payload: units,
    };
};

export const toggleBitcoinAmountUnits = () => (dispatch: Dispatch, getState: GetState) => {
    const currentUnits = getState().wallet.settings.bitcoinAmountUnit;

    const nextUnits =
        currentUnits === PROTO.AmountUnit.BITCOIN
            ? PROTO.AmountUnit.SATOSHI
            : PROTO.AmountUnit.BITCOIN;

    dispatch(setBitcoinAmountUnits(nextUnits));
};

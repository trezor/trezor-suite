import { analytics, EventType } from '@trezor/suite-analytics';
import { FeeLevel, PROTO } from '@trezor/connect';

import * as suiteActions from '@suite-actions/suiteActions';
import { Dispatch, GetState } from '@suite-types';
import { WALLET_SETTINGS } from './constants';
import { UNIT_ABBREVIATIONS } from '@wallet-hooks/useBitcoinAmountUnit';

import type { Network } from '@wallet-types';

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

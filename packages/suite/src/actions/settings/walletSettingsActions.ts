import { Dispatch, GetState } from '@suite-types';
import { WALLET_SETTINGS } from './constants';
import * as suiteActions from '@suite-actions/suiteActions';
import { Network, ExternalNetwork } from '@wallet-types';

export type WalletSettingsActions =
    | { type: typeof WALLET_SETTINGS.CHANGE_NETWORKS; payload: Network['symbol'][] }
    | {
          type: typeof WALLET_SETTINGS.CHANGE_EXTERNAL_NETWORKS;
          payload: ExternalNetwork['symbol'][];
      }
    | { type: typeof WALLET_SETTINGS.SET_LOCAL_CURRENCY; localCurrency: string }
    | { type: typeof WALLET_SETTINGS.SET_HIDE_BALANCE; toggled: boolean };

export const setLocalCurrency = (localCurrency: string) => ({
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
};

export const changeCoinVisibility = (symbol: Network['symbol'], shouldBeVisible: boolean) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
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
};

export const changeNetworks = (payload: Network['symbol'][]) => ({
    type: WALLET_SETTINGS.CHANGE_NETWORKS,
    payload,
});

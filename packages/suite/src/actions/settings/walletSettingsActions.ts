import { Dispatch, GetState } from '@suite-types';
import { WALLET_SETTINGS } from './constants';
import { NETWORKS } from '@wallet-config';
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

export const setDiscreetMode = (toggled: boolean) => ({
    type: WALLET_SETTINGS.SET_HIDE_BALANCE,
    toggled,
});

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

export const toggleGroupCoinsVisibility = (
    filterFn?: (network: Network) => boolean | undefined,
) => (dispatch: Dispatch, getState: GetState) => {
    const { enabledNetworks } = getState().wallet.settings;
    const matchedNetworks = filterFn ? NETWORKS.filter(filterFn) : NETWORKS;

    const atLeastOneChecked = matchedNetworks.some(m => enabledNetworks.includes(m.symbol));
    const nextEnabledNetworks = atLeastOneChecked
        ? enabledNetworks.filter(en => !matchedNetworks.some(m => m.symbol === en))
        : [...enabledNetworks, ...matchedNetworks.map(m => m.symbol)];

    return dispatch({
        type: WALLET_SETTINGS.CHANGE_NETWORKS,
        payload: Array.from(new Set(nextEnabledNetworks)),
    });
};

export const changeNetworks = (payload: Network['symbol'][]) => ({
    type: WALLET_SETTINGS.CHANGE_NETWORKS,
    payload,
});

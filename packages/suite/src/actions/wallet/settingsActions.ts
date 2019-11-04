import { Dispatch, GetState } from '@suite-types';
import { SETTINGS } from './constants';
import { NETWORKS } from '@wallet-config';
import { Network, ExternalNetwork } from '@wallet-types';

export type SettingsActions =
    | { type: typeof SETTINGS.CHANGE_NETWORKS; payload: Network['symbol'][] }
    | { type: typeof SETTINGS.CHANGE_EXTERNAL_NETWORKS; payload: ExternalNetwork['symbol'][] }
    | { type: typeof SETTINGS.SET_LOCAL_CURRENCY; localCurrency: string }
    | { type: typeof SETTINGS.SET_HIDE_BALANCE; toggled: boolean };

export const setLocalCurrency = (localCurrency: string) => ({
    type: SETTINGS.SET_LOCAL_CURRENCY,
    localCurrency: localCurrency.toLowerCase(),
});

export const setHideBalance = (toggled: boolean) => ({
    type: SETTINGS.SET_HIDE_BALANCE,
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
        type: SETTINGS.CHANGE_NETWORKS,
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
        type: SETTINGS.CHANGE_NETWORKS,
        payload: Array.from(new Set(nextEnabledNetworks)),
    });
};

export const changeNetworks = (payload: Network['symbol'][]) => ({
    type: SETTINGS.CHANGE_NETWORKS,
    payload,
});

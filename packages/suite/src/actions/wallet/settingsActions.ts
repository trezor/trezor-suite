import { Dispatch, GetState, AppState } from '@suite-types';
import { SETTINGS } from './constants';

export type SettingsActions =
    | { type: typeof SETTINGS.CHANGE_NETWORKS; payload: string[] }
    | { type: typeof SETTINGS.CHANGE_EXTERNAL_NETWORKS; payload: string[] }
    | { type: typeof SETTINGS.SET_LOCAL_CURRENCY; localCurrency: string }
    | { type: typeof SETTINGS.SET_HIDE_BALANCE; toggled: boolean }
    | { type: typeof SETTINGS.FROM_STORAGE; payload: AppState['wallet']['settings'] };

export const setLocalCurrency = (localCurrency: string) => ({
    type: SETTINGS.SET_LOCAL_CURRENCY,
    localCurrency: localCurrency.toLowerCase(),
});

export const setHideBalance = (toggled: boolean) => ({
    type: SETTINGS.SET_HIDE_BALANCE,
    toggled,
});

export const handleCoinVisibility = (
    symbol: string,
    shouldBeVisible: boolean,
    isExternal: boolean,
) => (dispatch: Dispatch, getState: GetState) => {
    const configuration: string[] = isExternal
        ? getState().wallet.settings.enabledExternalNetworks
        : getState().wallet.settings.enabledNetworks;
    let newConfig: string[] = configuration;
    const isAlreadyHidden = configuration.find(coin => coin === symbol);

    if (!shouldBeVisible) {
        newConfig = configuration.filter(coin => coin !== symbol);
    } else if (!isAlreadyHidden) {
        newConfig = [...configuration, symbol];
    }

    dispatch({
        type: isExternal ? SETTINGS.CHANGE_EXTERNAL_NETWORKS : SETTINGS.CHANGE_NETWORKS,
        payload: newConfig,
    });
};

export const toggleGroupCoinsVisibility = (
    allCoins: string[],
    checked: boolean,
    isExternal: boolean,
) => (dispatch: Dispatch) => {
    dispatch({
        type: isExternal ? SETTINGS.CHANGE_EXTERNAL_NETWORKS : SETTINGS.CHANGE_NETWORKS,
        payload: checked ? [] : allCoins,
    });
};

export const changeNetworks = (payload: string[]) => ({
    type: SETTINGS.CHANGE_NETWORKS,
    payload,
});

export const fromStorage = (payload: AppState['wallet']['settings']) => ({
    type: SETTINGS.FROM_STORAGE,
    payload,
});

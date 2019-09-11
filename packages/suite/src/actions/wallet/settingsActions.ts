import { Dispatch, GetState, AppState } from '@suite-types';
import { SETTINGS } from './constants';

export type SettingsActions =
    | { type: typeof SETTINGS.SET_HIDDEN_COINS; hiddenCoins: string[] }
    | { type: typeof SETTINGS.SET_HIDDEN_COINS_EXTERNAL; hiddenCoinsExternal: string[] }
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
        ? getState().wallet.settings.hiddenCoinsExternal
        : getState().wallet.settings.hiddenCoins;
    let newConfig: string[] = configuration;
    const isAlreadyHidden = configuration.find(coin => coin === symbol);

    if (shouldBeVisible) {
        newConfig = configuration.filter(coin => coin !== symbol);
    } else if (!isAlreadyHidden) {
        newConfig = [...configuration, symbol];
    }

    if (isExternal) {
        dispatch({
            type: SETTINGS.SET_HIDDEN_COINS_EXTERNAL,
            hiddenCoinsExternal: newConfig,
        });
    } else {
        dispatch({
            type: SETTINGS.SET_HIDDEN_COINS,
            hiddenCoins: newConfig,
        });
    }
};

export const toggleGroupCoinsVisibility = (
    allCoins: string[],
    checked: boolean,
    isExternal: boolean,
) => (dispatch: Dispatch) => {
    // supported coins
    if (checked && !isExternal) {
        dispatch({
            type: SETTINGS.SET_HIDDEN_COINS,
            hiddenCoins: [],
        });
    }

    if (!checked && !isExternal) {
        dispatch({
            type: SETTINGS.SET_HIDDEN_COINS,
            hiddenCoins: allCoins,
        });
    }

    // external coins
    if (checked && isExternal) {
        dispatch({
            type: SETTINGS.SET_HIDDEN_COINS_EXTERNAL,
            hiddenCoinsExternal: [],
        });
    }

    if (!checked && isExternal) {
        dispatch({
            type: SETTINGS.SET_HIDDEN_COINS_EXTERNAL,
            hiddenCoinsExternal: allCoins,
        });
    }
};

export const fromStorage = (payload: AppState['wallet']['settings']) => ({
    type: SETTINGS.FROM_STORAGE,
    payload,
});

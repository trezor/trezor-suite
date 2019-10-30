import { Dispatch, GetState } from '@suite-types';
import { SETTINGS } from './constants';
import { EXTERNAL_NETWORKS, NETWORKS } from '@wallet-config';
import { Network, ExternalNetwork, isExternalNetwork } from '@wallet-types';

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

const getNewConfigOnToggleOne = (
    enabledNetworks: string[],
    symbol: string,
    shouldBeVisible: boolean,
) => {
    const isAlreadyHidden = enabledNetworks.find(coin => coin === symbol);
    if (!shouldBeVisible) {
        return enabledNetworks.filter(coin => coin !== symbol);
    }
    if (!isAlreadyHidden) {
        return [...enabledNetworks, symbol];
    }
    return enabledNetworks;
};

export const changeCoinVisibility = (
    symbol: (ExternalNetwork | Network)['symbol'],
    shouldBeVisible: boolean,
) => (dispatch: Dispatch, getState: GetState) => {
    if (isExternalNetwork(symbol)) {
        dispatch({
            type: SETTINGS.CHANGE_EXTERNAL_NETWORKS,
            payload: getNewConfigOnToggleOne(
                getState().wallet.settings.enabledExternalNetworks as string[],
                symbol as string,
                shouldBeVisible,
            ) as ExternalNetwork['symbol'][],
        });
    } else {
        dispatch({
            type: SETTINGS.CHANGE_NETWORKS,
            payload: getNewConfigOnToggleOne(
                getState().wallet.settings.enabledNetworks as string[],
                symbol as string,
                shouldBeVisible,
            ) as Network['symbol'][],
        });
    }
};

const getNewConfigOnToggleGroup = (
    enabledNetworks: string[],
    isExternal: boolean,
    filterFn?: (network: Network) => boolean | undefined,
) => {
    const possibleNetworks = isExternal ? EXTERNAL_NETWORKS : NETWORKS;
    const matchedNetworks: Record<string, any>[] = filterFn
        ? (possibleNetworks as Network[]).filter(filterFn)
        : possibleNetworks;
    const atLeastOneChecked = matchedNetworks.some(m => enabledNetworks.includes(m.symbol));

    const newState = atLeastOneChecked
        ? enabledNetworks.filter(en => !matchedNetworks.some(m => m.symbol === en))
        : [...enabledNetworks, ...matchedNetworks.map(m => m.symbol)];
    return Array.from(new Set(newState)); // dedupe using Set
};

export const toggleGroupCoinsVisibility = (
    filterFn?: (network: Network) => boolean | undefined,
    isExternal?: boolean,
) => (dispatch: Dispatch, getState: GetState) => {
    if (!isExternal) {
        const { enabledNetworks } = getState().wallet.settings;
        return dispatch({
            type: SETTINGS.CHANGE_NETWORKS,
            payload: getNewConfigOnToggleGroup(
                enabledNetworks as string[],
                false,
                filterFn,
            ) as Network['symbol'][],
        });
    }

    const { enabledExternalNetworks } = getState().wallet.settings;

    return dispatch({
        type: SETTINGS.CHANGE_EXTERNAL_NETWORKS,
        payload: getNewConfigOnToggleGroup(
            enabledExternalNetworks as string[],
            true,
        ) as ExternalNetwork['symbol'][],
    });
};

export const changeNetworks = (payload: Network['symbol'][]) => ({
    type: SETTINGS.CHANGE_NETWORKS,
    payload,
});

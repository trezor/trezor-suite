import { FeeLevel } from 'trezor-connect';
import { WALLET_SETTINGS } from './constants';
import * as suiteActions from '@suite-actions/suiteActions';
import { Dispatch, GetState } from '@suite-types';
import { Network } from '@wallet-types';
import { BlockbookUrl } from '@wallet-types/blockbook';

export type WalletSettingsActions =
    | { type: typeof WALLET_SETTINGS.CHANGE_NETWORKS; payload: Network['symbol'][] }
    | { type: typeof WALLET_SETTINGS.SET_LOCAL_CURRENCY; localCurrency: string }
    | { type: typeof WALLET_SETTINGS.SET_HIDE_BALANCE; toggled: boolean }
    | {
          type: typeof WALLET_SETTINGS.SET_LAST_USED_FEE_LEVEL;
          symbol: Network['symbol'];
          feeLevel?: FeeLevel;
      }
    | { type: typeof WALLET_SETTINGS.ADD_BLOCKBOOK_URL; payload: BlockbookUrl }
    | { type: typeof WALLET_SETTINGS.REMOVE_BLOCKBOOK_URL; payload: BlockbookUrl };

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

export const setLastUsedFeeLevel = (feeLevel?: FeeLevel) => (
    dispatch: Dispatch,
    getState: GetState,
) => {
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

export const addBlockbookUrl = (payload: BlockbookUrl) => ({
    type: WALLET_SETTINGS.ADD_BLOCKBOOK_URL,
    payload,
});

export const removeBlockbookUrl = (payload: BlockbookUrl) => ({
    type: WALLET_SETTINGS.REMOVE_BLOCKBOOK_URL,
    payload,
});

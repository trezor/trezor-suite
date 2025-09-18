import { createThunk } from '@suite-common/redux-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { changeNetworks, setAutoForgetDeviceData } from './walletSettingsActions';
import { WALLET_SETTINGS } from './walletSettingsConstants';
import { selectEnabledNetworks } from './walletSettingsReducer';
import { accountsActions } from '../accounts/accountsActions';
import {
    forgetAllDevicesPersistentDataThunk,
    setDeviceAutoEjectThunk,
} from '../device/deviceThunks';
import { selectAccountsToBeForgotten } from '../selectors';

export const changeCoinVisibility = createThunk<
    void,
    {
        symbol: NetworkSymbol;
        shouldBeVisible: boolean;
    },
    void
>(WALLET_SETTINGS.CHANGE_COIN_VISIBILITY, ({ symbol, shouldBeVisible }, { dispatch, getState }) => {
    let enabledNetworks = selectEnabledNetworks(getState());
    const isAlreadyHidden = enabledNetworks.find(enabledSymbol => enabledSymbol === symbol);
    if (!shouldBeVisible) {
        enabledNetworks = enabledNetworks.filter(enabledSymbol => enabledSymbol !== symbol);
    } else if (!isAlreadyHidden) {
        enabledNetworks = [...enabledNetworks, symbol];
    }
    dispatch(changeNetworks(enabledNetworks));

    const accountsToRemove = selectAccountsToBeForgotten(getState());
    if (accountsToRemove.length > 0) {
        dispatch(accountsActions.removeAccount(accountsToRemove));
    }

    // this seems to be only for analyticsMiddleware
    // TODO: why does it fire an action with the same type as the thunk??
    dispatch({
        type: WALLET_SETTINGS.CHANGE_COIN_VISIBILITY,
        payload: { symbol, shouldBeVisible },
    });
});

type SetAutoForgetDeviceDataThunkParams = {
    shouldEnable: boolean;
};

export const setAutoForgetDeviceDataThunk = createThunk<
    void,
    SetAutoForgetDeviceDataThunkParams,
    void
>(
    `${WALLET_SETTINGS.AUTO_FORGET_DEVICE_DATA}/setAutoForgetDeviceDataThunk`,
    async ({ shouldEnable }, { dispatch }) => {
        if (!shouldEnable) {
            dispatch(setAutoForgetDeviceData(false));

            return;
        }

        dispatch(setAutoForgetDeviceData(true));
        await dispatch(forgetAllDevicesPersistentDataThunk());
        await dispatch(setDeviceAutoEjectThunk({ shouldEnable: true }));
    },
);

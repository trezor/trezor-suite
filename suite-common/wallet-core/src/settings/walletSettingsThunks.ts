import { createThunk } from '@suite-common/redux-utils';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { changeNetworks } from './walletSettingsActions';
import { WALLET_SETTINGS } from './walletSettingsConstants';
import { selectEnabledNetworks } from './walletSettingsReducer';
import { forgetAccountsThunk } from '../accounts/accountsThunks';
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
        dispatch(forgetAccountsThunk({ accountsToRemove }));
    }

    // this seems to be only for analyticsMiddleware
    // TODO: why does it fire an action with the same type as the thunk??
    dispatch({
        type: WALLET_SETTINGS.CHANGE_COIN_VISIBILITY,
        payload: { symbol, shouldBeVisible },
    });
});

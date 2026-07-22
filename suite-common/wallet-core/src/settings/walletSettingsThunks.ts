import { type Dispatch } from '@reduxjs/toolkit';

import { createThunk } from '@suite-common/redux-utils';
import { type NetworkSymbol } from '@suite-common/wallet-config';
import TrezorConnect, { PROTO } from '@trezor/connect';

import { changeNetworks, setBitcoinAmountUnits } from './walletSettingsActions';
import { WALLET_SETTINGS } from './walletSettingsConstants';
import { selectBitcoinAmountUnit, selectEnabledNetworks } from './walletSettingsReducer';
import { accountsActions } from '../accounts/accountsActions';
import { selectAccountsToBeForgotten } from '../selectors';

export const changeCoinVisibility = createThunk<
    void,
    {
        symbol: NetworkSymbol;
        shouldBeVisible: boolean;
    },
    void
>(
    WALLET_SETTINGS.CHANGE_COIN_VISIBILITY,
    async ({ symbol, shouldBeVisible }, { dispatch, getState }) => {
        let enabledNetworks = selectEnabledNetworks(getState());
        const isAlreadyEnabled = enabledNetworks.find(enabledSymbol => enabledSymbol === symbol);
        if (!shouldBeVisible) {
            enabledNetworks = enabledNetworks.filter(enabledSymbol => enabledSymbol !== symbol);
        } else if (!isAlreadyEnabled) {
            enabledNetworks = [...enabledNetworks, symbol];
        }
        // Suite is the source of truth for its coin settings — update Redux/UI first so the toggle
        // is responsive and never blocks on Connect.
        dispatch(changeNetworks(enabledNetworks));

        // Declare an enabled coin to Connect (one-way widening — disabling is intentionally not
        // propagated; Connect keeps deriving until the next init). Right after the Redux update (not
        // at the end) so it runs before any later state read.
        if (shouldBeVisible && !isAlreadyEnabled) {
            await TrezorConnect.updateConnectSettings({ enabledNetworks: [{ coin: symbol }] });
        }

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
    },
);

export const toggleBitcoinAmountUnits = () => (dispatch: Dispatch, getState: () => any) => {
    const currentUnits = selectBitcoinAmountUnit(getState());

    const nextUnits =
        currentUnits === PROTO.AmountUnit.BITCOIN
            ? PROTO.AmountUnit.SATOSHI
            : PROTO.AmountUnit.BITCOIN;

    dispatch(setBitcoinAmountUnits(nextUnits));
};

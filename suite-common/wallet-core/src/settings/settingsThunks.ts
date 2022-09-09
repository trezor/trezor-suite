import { createThunk } from '@suite-common/redux-utils';
import { FeeLevel, PROTO } from '@trezor/connect';
import { NetworkSymbol } from '@suite-common/wallet-config';

import { settingsActionPrefix, settingsActions } from './settingsActions';
import {
    selectCurrentBitcoinUnits,
    selectEnabledNetworks,
    selectLastUsedFeeLevel,
} from './settingsReducer';

type ChangeCoinVisibilityThunkPayload = {
    symbol: NetworkSymbol;
    shouldBeVisible: boolean;
};
/*
export const toggleBitcoinAmountUnits = createThunk(
    `${settingsActionPrefix}/toggleBitcoinAmountUnits`,
    (_, { dispatch }) => {

    },
);
 */

export const setDiscreetMode = createThunk(
    `${settingsActionPrefix}/setDiscreetMode`,
    (toggled: boolean, { dispatch, extra, getState }) => {
        const {
            // getState().suite.flags.discreetModeCompleted
            selectors: { selectDiscreetModeCompleted },
        } = extra;
        const discreetModeCompleted = selectDiscreetModeCompleted(getState());

        dispatch(settingsActions.setHideBalance(toggled));
        if (!discreetModeCompleted) {
            dispatch(suiteActions.setFlag('discreetModeCompleted', true));
        }

        analytics.report({
            type: EventType.MenuToggleDiscreet,
            payload: {
                value: toggled,
            },
        });
    },
);

export const changeCoinVisibility = createThunk(
    `${settingsActionPrefix}/changeCoinVisibility`,
    (payload: ChangeCoinVisibilityThunkPayload, { dispatch, getState }) => {
        const { symbol, shouldBeVisible } = payload;
        let enabledNetworks = selectEnabledNetworks(getState());
        const isAlreadyHidden = enabledNetworks.find(coin => coin === symbol);
        if (!shouldBeVisible) {
            enabledNetworks = enabledNetworks.filter(coin => coin !== symbol);
        } else if (!isAlreadyHidden) {
            enabledNetworks = [...enabledNetworks, symbol];
        }
        dispatch(settingsActions.changeNetworks(enabledNetworks));

        analytics.report({
            type: EventType.SettingsCoins,
            payload: {
                symbol,
                value: shouldBeVisible,
            },
        });
    },
);

export const setLastUsedFeeLevel = createThunk(
    `${settingsActionPrefix}/setLastUsedFeeLevel`,
    (feeLevel: FeeLevel, { dispatch, extra, getState }) => {
        const {
            selectors: { selectSelectedAccount },
        } = extra;
        const selectedAccount = selectSelectedAccount(getState());
        if (selectedAccount.status !== 'loaded') return;
        dispatch(settingsActions.setLastUsedFeeLevel(selectedAccount.account.symbol, feeLevel));
    },
);

export const getLastUsedFeeLevel = createThunk(
    `${settingsActionPrefix}/getLastUsedFeeLevel`,
    (_, { extra, getState }) => {
        const {
            selectors: { selectSelectedAccount },
        } = extra;
        const selectedAccount = selectSelectedAccount(getState());
        const lastUsedFeeLevel = selectLastUsedFeeLevel(getState());
        if (selectedAccount.status !== 'loaded') return;
        return lastUsedFeeLevel[selectedAccount.account.symbol];
    },
);

export const toggleBitcoinAmountUnits = createThunk(
    `${settingsActionPrefix}/toggleBitcoinAmountUnits`,
    (_, { dispatch, getState }) => {
        const currentUnits = selectCurrentBitcoinUnits(getState());

        const nextUnits =
            currentUnits === PROTO.AmountUnit.BITCOIN
                ? PROTO.AmountUnit.SATOSHI
                : PROTO.AmountUnit.BITCOIN;

        dispatch(setBitcoinAmountUnits(nextUnits));
    },
);

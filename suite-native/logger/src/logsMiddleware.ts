import { isAnyOf } from '@reduxjs/toolkit';

import { createMiddleware } from '@suite-common/redux-utils';
import { setOnboardingFinished } from '@suite-native/module-settings';
import { addLog } from '@suite-common/logger';
import {
    accountsActions,
    blockchainActions,
    fetchAndUpdateAccountThunk,
    fiatRatesActions,
    getFiatStaleTickersThunk,
    initFiatRatesThunk,
    onUpdateFiatRateThunk,
    updateCurrentFiatRatesThunk,
    updateLastWeekFiatRatesThunk,
    updateStaleFiatRatesThunk,
    updateTxsFiatRatesThunk,
} from '@suite-common/wallet-core';

const isAnyOfFiatRatesActions = isAnyOf(
    fiatRatesActions.removeFiatRate,
    fiatRatesActions.updateFiatRate,
    fiatRatesActions.updateLastWeekFiatRates,
    fiatRatesActions.updateTransactionFiatRate,
    getFiatStaleTickersThunk.pending,
    getFiatStaleTickersThunk.fulfilled,
    updateCurrentFiatRatesThunk.pending,
    updateCurrentFiatRatesThunk.fulfilled,
    updateStaleFiatRatesThunk.pending,
    updateStaleFiatRatesThunk.fulfilled,
    onUpdateFiatRateThunk.pending,
    onUpdateFiatRateThunk.fulfilled,
    updateLastWeekFiatRatesThunk.pending,
    updateLastWeekFiatRatesThunk.fulfilled,
    updateTxsFiatRatesThunk.pending,
    updateTxsFiatRatesThunk.fulfilled,
    updateTxsFiatRatesThunk.pending,
    updateTxsFiatRatesThunk.fulfilled,
    initFiatRatesThunk.pending,
    initFiatRatesThunk.fulfilled,
);

const isAnyOfAccountsActions = isAnyOf(
    ...Object.values(accountsActions),
    fetchAndUpdateAccountThunk.pending,
);

const isAnyOfBlockchainActions = isAnyOf(...Object.values(blockchainActions));

export const logsMiddleware = createMiddleware((action, { next, dispatch }) => {
    if (setOnboardingFinished.match(action)) {
        dispatch(addLog({ type: action.type, payload: { ...action } }));
    }

    if (isAnyOfFiatRatesActions(action)) {
        dispatch(addLog({ type: action.type, payload: { ...action.payload } }));
    }

    if (isAnyOfAccountsActions(action)) {
        dispatch(addLog({ type: action.type }));
    }

    if (isAnyOfBlockchainActions(action)) {
        dispatch(addLog({ type: action.type }));
    }

    return next(action);
});

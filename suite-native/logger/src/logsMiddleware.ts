import { isAnyOf } from '@reduxjs/toolkit';

import { createMiddleware } from '@suite-common/redux-utils';
import { setIsOnboardingFinished } from '@suite-native/module-settings';
import { addLog } from '@suite-common/logger';
import {
    accountsActions,
    blockchainActions,
    fetchAndUpdateAccountThunk,
} from '@suite-common/wallet-core';
import {
    updateFiatRatesThunk,
    updateMissingTxFiatRatesThunk,
    periodicFetchFiatRatesThunk,
    fetchFiatRatesThunk,
} from '@suite-native/fiat-rates';

const isAnyOfFiatRatesActions = isAnyOf(
    updateFiatRatesThunk.pending,
    updateFiatRatesThunk.fulfilled,
    updateFiatRatesThunk.rejected,

    // just pending and rejected for updateMissingTxFiatRatesThunk, fulfilled has to much data
    updateMissingTxFiatRatesThunk.pending,
    updateMissingTxFiatRatesThunk.rejected,

    periodicFetchFiatRatesThunk.pending,
    periodicFetchFiatRatesThunk.fulfilled,
    periodicFetchFiatRatesThunk.rejected,
    fetchFiatRatesThunk.pending,
    fetchFiatRatesThunk.fulfilled,
    fetchFiatRatesThunk.rejected,
);

const isAnyOfAccountsActions = isAnyOf(
    ...Object.values(accountsActions),
    fetchAndUpdateAccountThunk.pending,
);

const isAnyOfBlockchainActions = isAnyOf(...Object.values(blockchainActions));

export const logsMiddleware = createMiddleware((action, { next, dispatch }) => {
    if (setIsOnboardingFinished.match(action)) {
        dispatch(addLog({ type: action.type, payload: { ...action } }));
    }

    if (isAnyOfFiatRatesActions(action)) {
        dispatch(addLog({ type: action.type, payload: action.payload }));
    }

    if (isAnyOfAccountsActions(action)) {
        dispatch(addLog({ type: action.type, payload: action.payload }));
    }

    if (isAnyOfBlockchainActions(action)) {
        dispatch(addLog({ type: action.type, payload: action.payload }));
    }

    return next(action);
});

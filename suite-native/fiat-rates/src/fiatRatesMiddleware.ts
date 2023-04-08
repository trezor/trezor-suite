import { isAnyOf } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { transactionsActions, accountsActions, blockchainActions } from '@suite-common/wallet-core';

import { fetchFiatRatesThunk, updateTxsFiatRatesThunk } from './fiatRatesThunks';

export const prepareFiatRatesMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, extra, next, getState }) => {
        const {
            actions: { setWalletSettingsLocalCurrency },
            selectors: { selectLocalCurrency },
        } = extra;

        if (isAnyOf(accountsActions.updateAccount, accountsActions.createAccount)(action)) {
            dispatch(fetchFiatRatesThunk({ rateType: 'current' }));
            // dispatch(fetchFiatRatesThunk({ rateType: 'lastWeek' }));
        }

        if (transactionsActions.addTransaction.match(action)) {
            // fetch historical rates for each added transaction
            const { account, transactions } = action.payload;
            dispatch(
                updateTxsFiatRatesThunk({
                    account,
                    txs: transactions,
                    localCurrency: selectLocalCurrency(getState()),
                }),
            );
        }

        if (setWalletSettingsLocalCurrency.match(action)) {
            dispatch(fetchFiatRatesThunk({ rateType: 'lastWeek' }));
            // dispatch(fetchFiatRatesThunk({ rateType: 'current' }));
        }

        if (blockchainActions.connected.match(action)) {
            // TODO: verify if this is necessary, it should work only based on addTransaction action
            // just to be safe, refetch historical rates for transactions stored without these rates
            // dispatch(updateMissingTxFiatRatesThunk());
            dispatch(fetchFiatRatesThunk({ rateType: 'current' }));
        }

        return next(action);
    },
);

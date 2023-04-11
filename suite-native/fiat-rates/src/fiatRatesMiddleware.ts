import { isAnyOf } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { transactionsActions, accountsActions, blockchainActions } from '@suite-common/wallet-core';

import { fetchFiatRatesThunk, updateTxsFiatRatesThunk } from './fiatRatesThunks';

// Commented our code is intended for future usage in desktop, we will need to somehow use this code only in
// desktop suite, since mobile doesn't need last week rates. Maybe two middlewares?
export const prepareFiatRatesMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, extra, next, getState }) => {
        const {
            actions: { setWalletSettingsLocalCurrency },
            selectors: { selectLocalCurrency },
        } = extra;

        if (isAnyOf(accountsActions.updateAccount, accountsActions.createAccount)(action)) {
            dispatch(
                fetchFiatRatesThunk({
                    rateType: 'current',
                    localCurrency: selectLocalCurrency(getState()),
                }),
            );
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
            const { localCurrency } = action.payload;
            // dispatch(fetchFiatRatesThunk({ rateType: 'lastWeek' }));
            // We need to pass localCurrency as a parameter, because it is not yet updated in the store
            dispatch(fetchFiatRatesThunk({ rateType: 'current', localCurrency }));
        }

        if (blockchainActions.connected.match(action)) {
            // TODO: verify if this is necessary, it should work only based on addTransaction action
            // just to be safe, refetch historical rates for transactions stored without these rates
            // dispatch(updateMissingTxFiatRatesThunk());
            dispatch(
                fetchFiatRatesThunk({
                    rateType: 'current',
                    localCurrency: selectLocalCurrency(getState()),
                }),
            );
        }

        return next(action);
    },
);

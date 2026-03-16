import { isAnyOf } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { type Timestamp, type TokenAddress } from '@suite-common/wallet-types';
import { isNative } from '@trezor/env-utils';

import {
    fetchFiatRatesThunk,
    updateFiatRatesThunk,
    updateMissingTxFiatRatesThunk,
    updateTxsFiatRatesThunk,
} from './fiatRatesThunks';
import { accountsActions } from '../accounts/accountsActions';
import { blockchainActions } from '../blockchain/blockchainActions';
import { setBaseCurrency } from '../settings/walletSettingsActions';
import { selectBaseCurrency } from '../settings/walletSettingsReducer';
import { transactionsActions } from '../transactions/transactionsActions';
import { fetchAllTransactionsForAccountThunk } from '../transactions/transactionsThunks';

export const prepareFiatRatesMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, next, getState }) => {
        next(action); //next must be at the beginning, othervise tickers are not going to be updated and fiat rates wont fetch (the user will have to wait for 1m timeout)

        if (isAnyOf(accountsActions.updateAccount, accountsActions.createAccount)(action)) {
            dispatch(
                fetchFiatRatesThunk({
                    rateType: 'current',
                    localCurrency: selectBaseCurrency(getState()),
                }),
            );
            if (!isNative()) {
                dispatch(
                    fetchFiatRatesThunk({
                        rateType: 'lastWeek',
                        localCurrency: selectBaseCurrency(getState()),
                    }),
                );
            }
        }

        if (
            transactionsActions.addTransaction.match(action) &&
            // On mobile we fetch txs fiat rates on demand, for example when user opens tx details
            !isNative()
        ) {
            // fetch historical rates for each added transaction
            const { account, transactions } = action.payload;
            dispatch(
                updateTxsFiatRatesThunk({
                    accountKey: account.key,
                    txs: transactions,
                    baseCurrencyCode: selectBaseCurrency(getState()),
                }),
            );
        }

        if (
            isAnyOf(
                fetchAllTransactionsForAccountThunk.fulfilled,
                fetchAllTransactionsForAccountThunk.rejected,
            )(action) &&
            // On mobile we fetch txs fiat rates on demand, for example when user opens tx details
            !isNative()
        ) {
            // Fiat rates are fetched for transaction when the transaction is added (see above).
            // This is a fallback mechanism for cases when only fiat rates are missing.
            // It is happening in suite-native because it does not have fiat rates persisted.
            // But it can happen on desktop as well if fiat rates fetch fails for whatever reason.
            dispatch(
                updateMissingTxFiatRatesThunk({ localCurrency: selectBaseCurrency(getState()) }),
            );
        }

        if (setBaseCurrency.match(action)) {
            const { localCurrency } = action.payload;
            // We need to pass localCurrency as a parameter, because it is not yet updated in the store
            dispatch(fetchFiatRatesThunk({ rateType: 'current', localCurrency }));
            if (!isNative()) {
                dispatch(
                    fetchFiatRatesThunk({
                        rateType: 'lastWeek',
                        localCurrency,
                    }),
                );
                dispatch(updateMissingTxFiatRatesThunk({ localCurrency }));
            }
        }

        if (blockchainActions.connected.match(action)) {
            dispatch(
                fetchFiatRatesThunk({
                    rateType: 'current',
                    localCurrency: selectBaseCurrency(getState()),
                }),
            );
            if (!isNative()) {
                dispatch(
                    fetchFiatRatesThunk({
                        rateType: 'lastWeek',
                        localCurrency: selectBaseCurrency(getState()),
                    }),
                );
            }
        }

        // Fetch fiat rates for all tokens of newly suite-native discovered account.
        if (accountsActions.createAccount.match(action)) {
            const baseCurrencyCode = selectBaseCurrency(getState());

            const { tokens = [], symbol } = action.payload;
            const tokenTickers = tokens.map(token => ({
                symbol,
                tokenAddress: token.contract as TokenAddress,
            }));
            // include main account fiat rate ticker
            const tickers = [...tokenTickers, { symbol }];

            dispatch(
                updateFiatRatesThunk({
                    tickers,
                    rateType: 'current',
                    baseCurrencyCode,
                    fetchAttemptTimestamp: Date.now() as Timestamp,
                }),
            );
        }

        return action;
    },
);

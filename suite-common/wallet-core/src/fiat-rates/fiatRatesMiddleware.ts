import { isAnyOf } from '@reduxjs/toolkit';

import { isNative } from '@trezor/env-utils';
import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { Timestamp, TokenAddress } from '@suite-common/wallet-types';

import {
    fetchFiatRatesThunk,
    updateFiatRatesThunk,
    updateMissingTxFiatRatesThunk,
    updateTxsFiatRatesThunk,
} from './fiatRatesThunks';
import { blockchainActions } from '../blockchain/blockchainActions';
import { accountsActions } from '../accounts/accountsActions';
import { transactionsActions } from '../transactions/transactionsActions';

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
            if (!isNative()) {
                dispatch(
                    fetchFiatRatesThunk({
                        rateType: 'lastWeek',
                        localCurrency: selectLocalCurrency(getState()),
                    }),
                );
            }
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
            // We need to pass localCurrency as a parameter, because it is not yet updated in the store
            dispatch(fetchFiatRatesThunk({ rateType: 'current', localCurrency }));
            if (!isNative()) {
                dispatch(
                    fetchFiatRatesThunk({
                        rateType: 'lastWeek',
                        localCurrency,
                    }),
                );
            }
            dispatch(updateMissingTxFiatRatesThunk({ localCurrency }));
        }

        if (blockchainActions.connected.match(action)) {
            dispatch(
                fetchFiatRatesThunk({
                    rateType: 'current',
                    localCurrency: selectLocalCurrency(getState()),
                }),
            );
            if (!isNative()) {
                dispatch(
                    fetchFiatRatesThunk({
                        rateType: 'lastWeek',
                        localCurrency: selectLocalCurrency(getState()),
                    }),
                );
            }
        }

        // Fetch fiat rates for all tokens of newly suite-native discovered account.
        if (accountsActions.createIndexLabeledAccount.match(action)) {
            const localCurrency = selectLocalCurrency(getState());

            const { tokens, symbol } = action.payload;
            tokens?.forEach(token => {
                dispatch(
                    updateFiatRatesThunk({
                        ticker: {
                            symbol,
                            tokenAddress: token.contract as TokenAddress,
                        },
                        rateType: 'current',
                        localCurrency,
                        fetchAttemptTimestamp: Date.now() as Timestamp,
                    }),
                );
            });
        }

        return next(action);
    },
);

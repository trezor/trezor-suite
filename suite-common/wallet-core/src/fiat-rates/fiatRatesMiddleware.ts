import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { BLOCKCHAIN as TREZOR_CONNECT_BLOCKCHAIN_ACTIONS } from '@trezor/connect';
import { isTickerSupportedByBlockbook } from '@suite-common/fiat-services';

import { transactionsActions } from '../transactions/transactionsActions';
import { accountsActions } from '../accounts/accountsActions';
import { selectAccounts } from '../accounts/accountsReducer';
import {
    removeFiatRatesForDisabledNetworksThunk,
    updateCurrentFiatRatesThunk,
    initFiatRatesThunk,
    updateLastWeekFiatRatesThunk,
    updateTxsFiatRatesThunk,
    onUpdateFiatRateThunk,
} from './fiatRatesThunks';
import { blockchainActions } from '../blockchain/blockchainActions';
import { selectAccountTransactions } from '../transactions/transactionsReducer';

export const prepareFiatRatesMiddleware = createMiddlewareWithExtraDeps(
    (action, { dispatch, extra, next, getState }) => {
        const {
            selectors: { selectLocalCurrency },
            actions: { setWalletSettingsLocalCurrency, changeWalletSettingsNetworks },
        } = extra;
        const prevStateAccounts = selectAccounts(getState());
        const prevStateLocalCurrency = selectLocalCurrency(getState());

        if (accountsActions.updateAccount.match(action)) {
            // fetch rates for new tokens added on account update
            const account = action.payload;
            const prevAccount = prevStateAccounts.find(
                a => a.descriptor === account.descriptor && a.symbol === account.symbol,
            );

            if (account.tokens) {
                const difference = account.tokens.filter(
                    token =>
                        !prevAccount?.tokens?.find(
                            prevToken => prevToken.contract === token.contract,
                        ),
                );

                difference.forEach(token => {
                    if (token.symbol) {
                        dispatch(
                            updateCurrentFiatRatesThunk({
                                ticker: {
                                    symbol: token.symbol,
                                    mainNetworkSymbol: account.symbol,
                                    tokenAddress: token.contract,
                                },
                            }),
                        );
                    }
                });
            }
        }

        if (accountsActions.createAccount.match(action)) {
            // fetch current rates for account's tokens
            const account = action.payload;
            account.tokens?.forEach(token => {
                if (!token.symbol) {
                    return;
                }
                dispatch(
                    updateCurrentFiatRatesThunk({
                        ticker: {
                            symbol: token.symbol,
                            mainNetworkSymbol: account.symbol,
                            tokenAddress: token.contract,
                        },
                    }),
                );
            });
        }

        if (transactionsActions.addTransaction.match(action)) {
            // fetch historical rates for each added transaction
            const { account, transactions } = action.payload;
            dispatch(
                updateTxsFiatRatesThunk({
                    account,
                    txs: transactions,
                    localCurrency: prevStateLocalCurrency,
                }),
            );
        }

        if (setWalletSettingsLocalCurrency.match(action)) {
            // For coins depending on Coingecko API we always download fiat rates for only one currency.
            const { localCurrency } = action.payload;

            dispatch(updateLastWeekFiatRatesThunk(localCurrency));

            prevStateAccounts.forEach(account => {
                // if fiat rates are downloaded from blockbook we already have all the currency-rate pairs.
                if (isTickerSupportedByBlockbook({ symbol: account.symbol })) return;

                const accountTransactions = selectAccountTransactions(getState(), account.key);
                dispatch(
                    updateTxsFiatRatesThunk({
                        account,
                        txs: accountTransactions,
                        localCurrency,
                    }),
                );
            });
        }

        if (changeWalletSettingsNetworks.match(action)) {
            dispatch(removeFiatRatesForDisabledNetworksThunk());
        }

        if (blockchainActions.connected.match(action)) {
            dispatch(initFiatRatesThunk(action.payload));
        }

        if (action.type === TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.FIAT_RATES_UPDATE) {
            dispatch(onUpdateFiatRateThunk(action.payload));
        }

        return next(action);
    },
);

import { BLOCKCHAIN } from '@trezor/connect';
import { createMiddlewareWithExtraDependencies } from '@suite-common/redux-utils';

import { accountsActions } from '../accounts/accountsActions';
import { selectAccounts } from '../accounts/accountsReducer';
import {
    removeFiatRatesForDisabledNetworksThunk,
    updateCurrentFiatRatesThunk,
    initFiatRatesThunk,
    updateLastWeekFiatRatesThunk,
    updateTxsFiatRatesThunk,
} from './fiatRatesThunks';

export const { FIAT_RATES_UPDATE } = BLOCKCHAIN;

export const fiatRatesMiddleware = createMiddlewareWithExtraDependencies(
    (action, { dispatch, extra, getState }) => {
        const {
            actions: {
                addTransaction,
                blockchainConnected,
                setWalletSettingsLocalCurrency,
                changeWalletSettingsNetworks,
            },
        } = extra;
        const prevStateAccounts = selectAccounts(getState());

        if (accountsActions.updateAccount.match(action)) {
            // fetch rates for new tokens added on account update
            const account = action.payload;
            const prevAccount = prevStateAccounts.find(
                a => a.descriptor === account.descriptor && a.symbol === account.symbol,
            );

            if (account.tokens) {
                const difference = account.tokens.filter(
                    token =>
                        !prevAccount?.tokens?.find(prevToken => prevToken.symbol === token.symbol),
                );

                difference.forEach(token => {
                    if (token.symbol) {
                        dispatch(
                            updateCurrentFiatRatesThunk({
                                ticker: {
                                    symbol: token.symbol,
                                    mainNetworkSymbol: account.symbol,
                                    tokenAddress: token.address,
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
                            tokenAddress: token.address,
                        },
                    }),
                );
            });
        }

        if (addTransaction.match(action)) {
            // fetch historical rates for each added transaction
            const { account, transactions } = action.payload;
            dispatch(
                updateTxsFiatRatesThunk({
                    account,
                    txs: transactions,
                }),
            );
        }

        if (setWalletSettingsLocalCurrency.match(action)) {
            // for coins relying on coingecko we only fetch rates for one fiat currency
            dispatch(updateLastWeekFiatRatesThunk());
        }

        if (changeWalletSettingsNetworks.match(action)) {
            dispatch(removeFiatRatesForDisabledNetworksThunk());
        }

        if (blockchainConnected.match(action)) {
            dispatch(initFiatRatesThunk(action.payload));
        }
    },
);

import { MiddlewareAPI } from 'redux';
import { BLOCKCHAIN } from '@wallet-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import { accountsActions, transactionsActions,     removeFiatRatesForDisabledNetworks,
    updateCurrentFiatRates,
    initFiatRates,
    updateLastWeekFiatRates,
    updateTxsFiatRates,
    onUpdateFiatRate, } from '@suite-common/wallet-core';
import { AppState, Action, Dispatch } from '@suite-types';

const fiatRatesMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const prevState = api.getState();
        // pass action
        next(action);

        if (accountsActions.updateAccount.match(action)) {
            // fetch rates for new tokens added on account update
            const account = action.payload;
            const prevAccount = prevState.wallet.accounts.find(
                a => a.descriptor === account.descriptor && a.symbol === account.symbol,
            );

            if (account.tokens) {
                const difference = account.tokens.filter(
                    token =>
                        !prevAccount?.tokens?.find(prevToken => prevToken.symbol === token.symbol),
                );

                difference.forEach(token => {
                    if (token.symbol) {
                        api.dispatch(
                            updateCurrentFiatRates({
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
                api.dispatch(
                    updateCurrentFiatRates({
                        ticker: {
                            symbol: token.symbol,
                            mainNetworkSymbol: account.symbol,
                            tokenAddress: token.address,
                        },
                    }),
                );
            });
        }

        if (transactionsActions.addTransaction.match(action))
            // fetch historical rates for each added transaction
            const { account, transactions } = action.payload;
            api.dispatch(
                updateTxsFiatRates({
                    account,
                    txs: transactions,
                }),
            );

        switch (action.type) {
            case BLOCKCHAIN.CONNECTED:
                api.dispatch(initFiatRates(action.payload));
                break;
            case BLOCKCHAIN.FIAT_RATES_UPDATE:
                api.dispatch(onUpdateFiatRate(action.payload));
                break;
            case WALLET_SETTINGS.CHANGE_NETWORKS:
                api.dispatch(removeFiatRatesForDisabledNetworks());
                break;
            case WALLET_SETTINGS.SET_LOCAL_CURRENCY:
                // for coins relying on coingecko we only fetch rates for one fiat currency
                api.dispatch(updateLastWeekFiatRates());
                break;
            default:
                break;
        }

        return action;
    };

export default fiatRatesMiddleware;

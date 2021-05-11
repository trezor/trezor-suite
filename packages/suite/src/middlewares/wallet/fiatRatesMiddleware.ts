import { MiddlewareAPI } from 'redux';
import { BLOCKCHAIN, ACCOUNT, TRANSACTION } from '@wallet-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import * as fiatRatesActions from '@wallet-actions/fiatRatesActions';
import { AppState, Action, Dispatch } from '@suite-types';

const fiatRatesMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    const prevState = api.getState();
    // pass action
    next(action);

    switch (action.type) {
        case BLOCKCHAIN.CONNECTED:
            api.dispatch(fiatRatesActions.initRates(action.payload));
            break;
        case BLOCKCHAIN.FIAT_RATES_UPDATE:
            api.dispatch(fiatRatesActions.onUpdateRate(action.payload));
            break;
        case TRANSACTION.ADD:
            // fetch historical rates for each added transaction
            api.dispatch(fiatRatesActions.updateTxsRates(action.account, action.transactions));
            break;
        case ACCOUNT.UPDATE: {
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
                            fiatRatesActions.updateCurrentRates({
                                symbol: token.symbol,
                                mainNetworkSymbol: account.symbol,
                                tokenAddress: token.address,
                            }),
                        );
                    }
                });
            }
            break;
        }
        case ACCOUNT.CREATE: {
            // fetch current rates for account's tokens
            const account = action.payload;
            account.tokens?.forEach(token => {
                if (!token.symbol) {
                    return;
                }
                api.dispatch(
                    fiatRatesActions.updateCurrentRates({
                        symbol: token.symbol,
                        mainNetworkSymbol: account.symbol,
                        tokenAddress: token.address,
                    }),
                );
            });

            break;
        }
        case WALLET_SETTINGS.CHANGE_NETWORKS:
            api.dispatch(fiatRatesActions.removeRatesForDisabledNetworks());
            break;
        case WALLET_SETTINGS.SET_LOCAL_CURRENCY:
            // for coins relying on coingecko we only fetch rates for one fiat currency
            api.dispatch(fiatRatesActions.updateLastWeekRates());
            break;
        default:
            break;
    }

    return action;
};

export default fiatRatesMiddleware;

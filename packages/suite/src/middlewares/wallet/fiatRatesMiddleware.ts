import { MiddlewareAPI } from 'redux';
import { SUITE } from '@suite-actions/constants';
import { BLOCKCHAIN, ACCOUNT, TRANSACTION } from '@wallet-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import * as fiatRatesActions from '@wallet-actions/fiatRatesActions';
import { AppState, Action, Dispatch } from '@suite-types';

const fiatRatesMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    // pass action
    next(action);

    switch (action.type) {
        case SUITE.READY:
            // TODO: change to WALLET.READY (Dashboard needs rates too so WALLET.RAEADY doesn't suffice)
            api.dispatch(fiatRatesActions.initRates());
            break;
        case BLOCKCHAIN.FIAT_RATES_UPDATE:
            api.dispatch(fiatRatesActions.onUpdateRate(action.payload));
            break;
        case TRANSACTION.ADD:
            // fetch historical rates for each added transaction
            api.dispatch(fiatRatesActions.updateTxsRates(action.account, action.transactions));
            break;
        case ACCOUNT.CREATE: {
            // fetch current rates for account's tokens
            // TODO: new tokens could appear also on account.UPDATE
            const account = action.payload;
            if (account.tokens) {
                account.tokens.forEach(t => {
                    if (t.symbol) {
                        api.dispatch(
                            fiatRatesActions.updateCurrentRates({
                                symbol: t.symbol,
                                mainNetworkSymbol: account.symbol,
                            }),
                        );
                    }
                });
            }
            break;
        }
        case WALLET_SETTINGS.CHANGE_NETWORKS:
            api.dispatch(fiatRatesActions.removeRatesForDisabledNetworks());
            api.dispatch(fiatRatesActions.updateStaleRates());
            api.dispatch(fiatRatesActions.updateLastWeekRates());
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

import { MiddlewareAPI } from 'redux';
import { BLOCKCHAIN } from 'trezor-connect';
import { SUITE } from '@suite-actions/constants';
import { ACCOUNT, TRANSACTION } from '@wallet-actions/constants';
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
            // TODO: change to WALLET.READY
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
            const account = action.payload;
            if (account.tokens) {
                account.tokens.forEach(t => {
                    if (t.symbol) {
                        api.dispatch(fiatRatesActions.updateCurrentRates({ symbol: t.symbol }));
                    }
                });
            }
            break;
        }
        case WALLET_SETTINGS.CHANGE_NETWORKS:
            api.dispatch(fiatRatesActions.updateStaleRates());
            break;
        default:
            break;
    }

    return action;
};

export default fiatRatesMiddleware;

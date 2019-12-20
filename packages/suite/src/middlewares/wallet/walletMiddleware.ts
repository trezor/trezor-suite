import { MiddlewareAPI } from 'redux';
import { SUITE, ROUTER } from '@suite-actions/constants';
import { ACCOUNT, DISCOVERY, SETTINGS } from '@wallet-actions/constants';
import * as selectedAccountActions from '@wallet-actions/selectedAccountActions';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import * as blockchainActions from '@wallet-actions/blockchainActions';
import { observeChanges } from '@suite-utils/reducerUtils';
import { AppState, Action, Dispatch } from '@suite-types';
import { findRoute } from '@suite-utils/router';
import { handleRatesUpdate } from '@wallet-actions/fiatRatesActions';

const walletMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    const prevState = api.getState();

    if (
        action.type === ROUTER.LOCATION_CHANGE &&
        prevState.router.route &&
        prevState.router.route.name === 'wallet-account-send'
    ) {
        const nextRoute = findRoute(action.url);
        // don't call dispose if next route is the same
        if (nextRoute && nextRoute.name !== 'wallet-account-send') {
            api.dispatch(sendFormActions.dispose());
        }
    }

    if (
        action.type === ACCOUNT.CREATE ||
        action.type === ACCOUNT.UPDATE ||
        action.type === ACCOUNT.REMOVE
    ) {
        api.dispatch(blockchainActions.subscribe());
    }

    // propagate action to reducers
    next(action);

    const nextState = api.getState();

    if (
        action.type === ROUTER.LOCATION_CHANGE &&
        observeChanges(prevState.router.params, nextState.router.params)
    ) {
        api.dispatch(selectedAccountActions.dispose());
    }

    switch (action.type) {
        case DISCOVERY.UPDATE:
        case DISCOVERY.COMPLETE:
        case SUITE.SELECT_DEVICE:
        case SUITE.UPDATE_SELECTED_DEVICE:
        case ROUTER.LOCATION_CHANGE:
        case ACCOUNT.UPDATE:
            // update discovery in selectedAccount
            api.dispatch(selectedAccountActions.observe(prevState, action));
            break;
        case SETTINGS.CHANGE_NETWORKS:
            api.dispatch(handleRatesUpdate());
            break;
        default:
        // no default
    }

    return action;
};

export default walletMiddleware;

import { MiddlewareAPI } from 'redux';
import { SUITE, ROUTER } from '@suite-actions/constants';
import { DISCOVERY } from '@wallet-actions/constants';
import * as selectedAccountActions from '@wallet-actions/selectedAccountActions';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import { AppState, Action, Dispatch } from '@suite-types';

const walletMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    const prevState = api.getState();
    if (
        action.type === ROUTER.LOCATION_CHANGE &&
        prevState.router.route &&
        prevState.router.route.name === 'wallet-account-send'
    ) {
        api.dispatch(sendFormActions.dispose());
    }

    // propagate action to reducers (await is necessary here)
    next(action);

    const nextState = api.getState();

    if (
        action.type === ROUTER.LOCATION_CHANGE &&
        nextState.router.route &&
        nextState.router.route.name === 'wallet-account-send'
    ) {
        api.dispatch(sendFormActions.init());
    }

    switch (action.type) {
        case DISCOVERY.UPDATE:
        case SUITE.SELECT_DEVICE:
        case SUITE.UPDATE_SELECTED_DEVICE:
        case ROUTER.LOCATION_CHANGE:
            // update discovery in selectedAccount
            api.dispatch(selectedAccountActions.observe(prevState, action));
            break;

        default:
            break;
    }

    // TODO: copy all logic from old WalletService middleware
    const currentState = api.getState();
    if (
        action.type === ROUTER.LOCATION_CHANGE &&
        currentState.router.params &&
        prevState.router.params !== currentState.router.params
    ) {
        api.dispatch(selectedAccountActions.dispose());
    }

    return action;
};

export default walletMiddleware;

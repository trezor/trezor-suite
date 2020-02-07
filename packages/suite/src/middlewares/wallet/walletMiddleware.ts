import { MiddlewareAPI } from 'redux';
import { SUITE, ROUTER } from '@suite-actions/constants';
import { ACCOUNT } from '@wallet-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import * as selectedAccountActions from '@wallet-actions/selectedAccountActions';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import * as receiveActions from '@wallet-actions/receiveActions';
import * as blockchainActions from '@wallet-actions/blockchainActions';
import { AppState, Action, Dispatch } from '@suite-types';
import { handleRatesUpdate } from '@wallet-actions/fiatRatesActions';

const walletMiddleware = (api: MiddlewareAPI<Dispatch, AppState>) => (next: Dispatch) => (
    action: Action,
): Action => {
    const prevState = api.getState();
    const prevRouter = prevState.router;

    if (action.type === SUITE.FORGET_DEVICE) {
        const deviceState = action.payload.state;
        const accounts = api.getState().wallet.accounts.filter(a => a.deviceState === deviceState);
        api.dispatch({
            type: ACCOUNT.REMOVE,
            payload: accounts,
        });
    }

    // propagate action to reducers
    next(action);

    if (
        action.type === ACCOUNT.CREATE ||
        action.type === ACCOUNT.UPDATE ||
        action.type === ACCOUNT.REMOVE
    ) {
        api.dispatch(blockchainActions.subscribe());
    }

    const nextRouter = api.getState().router;

    if (prevRouter.app === 'wallet' && action.type === ROUTER.LOCATION_CHANGE) {
        // leaving wallet app or switching between accounts
        const reset =
            (prevRouter.app !== nextRouter.app && !nextRouter.route?.isModal) ||
            (nextRouter.app === 'wallet' && nextRouter.hash !== prevRouter.hash);
        if (reset) {
            api.dispatch(selectedAccountActions.dispose());
            api.dispatch(sendFormActions.dispose());
            api.dispatch(receiveActions.dispose());
        }
    }

    api.dispatch(selectedAccountActions.getStateForAction(action));

    if (action.type === WALLET_SETTINGS.CHANGE_NETWORKS) {
        api.dispatch(handleRatesUpdate());
    }

    return action;
};

export default walletMiddleware;

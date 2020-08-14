import { MiddlewareAPI } from 'redux';
import { SUITE, ROUTER } from '@suite-actions/constants';
import { ACCOUNT } from '@wallet-actions/constants';
import * as selectedAccountActions from '@wallet-actions/selectedAccountActions';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import * as receiveActions from '@wallet-actions/receiveActions';
import * as transactionActions from '@wallet-actions/transactionActions';
import * as blockchainActions from '@wallet-actions/blockchainActions';
import { AppState, Action, Dispatch } from '@suite-types';

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

    if (action.type === ACCOUNT.CREATE) {
        const account = action.payload;
        // gather transactions from account.create action
        api.dispatch(transactionActions.add(account.history.transactions || [], account, 1));
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

    let resetReducers = action.type === SUITE.SELECT_DEVICE;
    if (prevRouter.app === 'wallet' && action.type === ROUTER.LOCATION_CHANGE) {
        // leaving wallet app or switching between accounts
        resetReducers =
            (prevRouter.app !== nextRouter.app && !nextRouter.route?.isModal) ||
            (nextRouter.app === 'wallet' && nextRouter.hash !== prevRouter.hash);
    }
    if (resetReducers) {
        api.dispatch(selectedAccountActions.dispose());
        api.dispatch(sendFormActions.dispose());
        api.dispatch(receiveActions.dispose());
    }

    api.dispatch(selectedAccountActions.getStateForAction(action));

    return action;
};

export default walletMiddleware;

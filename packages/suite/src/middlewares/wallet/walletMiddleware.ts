import { MiddlewareAPI } from 'redux';
import { SUITE, ROUTER } from '@suite-actions/constants';
import { ACCOUNT, TRANSACTION } from '@wallet-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import * as selectedAccountActions from '@wallet-actions/selectedAccountActions';
import * as sendFormActions from '@wallet-actions/send/sendFormActions';
import * as receiveActions from '@wallet-actions/receiveActions';
import * as transactionActions from '@wallet-actions/transactionActions';
import * as blockchainActions from '@wallet-actions/blockchainActions';
import { AppState, Action, Dispatch } from '@suite-types';
import { handleRatesUpdate, fetchFiatRatesForTxs } from '@wallet-actions/fiatRatesActions';

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
        // gather transactions from account.create action
        api.dispatch(
            transactionActions.add(action.payload.history.transactions || [], action.payload, 1),
        );
    }

    if (action.type === TRANSACTION.ADD) {
        // fetch historical rates for each added transaction
        api.dispatch(fetchFiatRatesForTxs(action.account, action.transactions));
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

    if (action.type === WALLET_SETTINGS.CHANGE_NETWORKS) {
        api.dispatch(handleRatesUpdate());
    }

    return action;
};

export default walletMiddleware;

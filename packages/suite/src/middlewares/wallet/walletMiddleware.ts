import TrezorConnect from 'trezor-connect';
import { MiddlewareAPI } from 'redux';
import { SUITE, ROUTER } from '@suite-actions/constants';
import { ACCOUNT } from '@wallet-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import * as selectedAccountActions from '@wallet-actions/selectedAccountActions';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import * as receiveActions from '@wallet-actions/receiveActions';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
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

    if (action.type === ACCOUNT.CREATE || action.type === ACCOUNT.UPDATE) {
        api.dispatch(blockchainActions.subscribe(action.payload.symbol));
    }

    if (action.type === ACCOUNT.REMOVE) {
        api.dispatch(blockchainActions.unsubscribe(action.payload));
    }

    // Update custom backends
    if (
        action.type === WALLET_SETTINGS.ADD_BLOCKBOOK_URL ||
        action.type === WALLET_SETTINGS.REMOVE_BLOCKBOOK_URL
    ) {
        const { coin } = action.payload;
        const { blockbookUrls } = api.getState().wallet.settings;

        TrezorConnect.blockchainSetCustomBackend({
            coin: action.payload.coin,
            blockchainLink: {
                type: 'blockbook',
                url: blockbookUrls.filter(b => b.coin === coin).map(b => b.url),
            },
        });
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
        api.dispatch(coinmarketBuyActions.dispose());
    }

    api.dispatch(selectedAccountActions.getStateForAction(action));

    return action;
};

export default walletMiddleware;

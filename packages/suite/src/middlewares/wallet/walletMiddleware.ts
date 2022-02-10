import { MiddlewareAPI } from 'redux';
import { SUITE, ROUTER } from '@suite-actions/constants';
import { ACCOUNT, TRANSACTION } from '@wallet-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import * as selectedAccountActions from '@wallet-actions/selectedAccountActions';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import * as modalActions from '@suite-actions/modalActions';
import * as receiveActions from '@wallet-actions/receiveActions';
import * as cardanoStakingActions from '@wallet-actions/cardanoStakingActions';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import * as transactionActions from '@wallet-actions/transactionActions';
import * as blockchainActions from '@wallet-actions/blockchainActions';
import { AppState, Action, Dispatch } from '@suite-types';

const walletMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const prevState = api.getState();

        if (action.type === SUITE.FORGET_DEVICE) {
            const deviceState = action.payload.state;
            const accounts = api
                .getState()
                .wallet.accounts.filter(a => a.deviceState === deviceState);
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

        if (action.type === TRANSACTION.ADD) {
            api.dispatch(
                cardanoStakingActions.validatePendingStakeTxOnTx(
                    action.account,
                    action.transactions,
                ),
            );
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
            // action.type === WALLET_SETTINGS.ADD_BLOCKBOOK_URL ||
            // action.type === WALLET_SETTINGS.REMOVE_BLOCKBOOK_URL ||
            action.type === WALLET_SETTINGS.SET_BACKEND ||
            action.type === WALLET_SETTINGS.REMOVE_BACKEND
        ) {
            api.dispatch(blockchainActions.setCustomBackend(action.payload.coin));
        }

        const prevRouter = prevState.router;
        const nextRouter = api.getState().router;
        let resetReducers = action.type === SUITE.SELECT_DEVICE;

        // show modal when leaving the spend tab in active trade
        if (action.type === ROUTER.LOCATION_CHANGE) {
            if (prevState.wallet.coinmarket.sell.showLeaveModal) {
                api.dispatch(
                    modalActions.openModal({
                        type: 'coinmarket-leave-spend',
                        routeToContinue: nextRouter.route?.name,
                    }),
                );
            }
        }

        if (
            action.type === SUITE.FORGET_DEVICE &&
            prevState.wallet.selectedAccount.account?.deviceState === action.payload.state
        ) {
            // if currently selected account is related to forgotten device
            resetReducers = true;
        }

        if (prevRouter.app === 'wallet' && action.type === ROUTER.LOCATION_CHANGE) {
            // leaving wallet app or switching between accounts
            resetReducers =
                (nextRouter.app !== 'wallet' && !nextRouter.route?.isForegroundApp) ||
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

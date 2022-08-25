import type { MiddlewareAPI } from 'redux';

import { SUITE, ROUTER } from '@suite-actions/constants';
import { WALLET_SETTINGS } from '@settings-actions/constants';
import { BLOCKCHAIN } from '@wallet-actions/constants';
import * as selectedAccountActions from '@wallet-actions/selectedAccountActions';
import * as sendFormActions from '@wallet-actions/sendFormActions';
import * as modalActions from '@suite-actions/modalActions';
import { accountsActions, transactionsActions } from '@suite-common/wallet-core';
import * as receiveActions from '@wallet-actions/receiveActions';
import * as cardanoStakingActions from '@wallet-actions/cardanoStakingActions';
import * as coinmarketBuyActions from '@wallet-actions/coinmarketBuyActions';
import * as blockchainActions from '@wallet-actions/blockchainActions';
import type { AppState, Action, Dispatch } from '@suite-types';
import { isAnyOf } from '@reduxjs/toolkit';

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
            api.dispatch(accountsActions.removeAccount(accounts));
        }

        if (accountsActions.createAccount.match(action)) {
            // gather transactions from account.create action
            const account = action.payload;
            api.dispatch(
                transactionsActions.addTransaction({
                    transactions: account.history.transactions || [],
                    account,
                    page: 1,
                }),
            );
        }

        if (transactionsActions.addTransaction.match(action)) {
            api.dispatch(
                cardanoStakingActions.validatePendingStakeTxOnTx(
                    action.payload.account,
                    action.payload.transactions,
                ),
            );
        }

        // propagate action to reducers
        next(action);

        if (isAnyOf(accountsActions.createAccount, accountsActions.updateAccount)(action)) {
            api.dispatch(blockchainActions.subscribe(action.payload.symbol));
        }

        if (accountsActions.removeAccount.match(action)) {
            api.dispatch(blockchainActions.unsubscribe(action.payload));
        }

        // Update custom backends
        if (action.type === BLOCKCHAIN.SET_BACKEND) {
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
            api.dispatch(accountsActions.disposeAccount());
            api.dispatch(sendFormActions.dispose());
            api.dispatch(receiveActions.dispose());
            api.dispatch(coinmarketBuyActions.dispose());
        }

        if (action.type === WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS) {
            api.dispatch(sendFormActions.convertDrafts());
        }

        api.dispatch(selectedAccountActions.getStateForAction(action));

        return action;
    };

export default walletMiddleware;

import { isAnyOf } from '@reduxjs/toolkit';
import type { MiddlewareAPI } from 'redux';

import { getTxsPerPage } from '@suite-common/suite-utils';
import { tradingBuyActions } from '@suite-common/trading';
import {
    WALLET_SETTINGS,
    accountsActions,
    blockchainActions,
    convertSendFormDraftsBtcAmountUnitsThunk,
    deviceActions,
    sendFormActions,
    setCustomBackendThunk,
    stakeActions,
    subscribeBlockchainThunk,
    transactionsActions,
    unsubscribeBlockchainThunk,
} from '@suite-common/wallet-core';

import { ROUTER } from 'src/actions/suite/constants';
import * as cardanoStakingActions from 'src/actions/wallet/cardanoStakingActions';
import * as receiveActions from 'src/actions/wallet/receiveActions';
import * as selectedAccountActions from 'src/actions/wallet/selectedAccountActions';
import * as tradingCommonActions from 'src/actions/wallet/trading/tradingCommonActions';
import { selectSelectedAccountKey } from 'src/reducers/wallet/selectedAccountReducer';
import type { Action, AppState, Dispatch } from 'src/types/suite';

const walletMiddleware =
    (api: MiddlewareAPI<Dispatch, AppState>) =>
    (next: Dispatch) =>
    (action: Action): Action => {
        const prevState = api.getState();

        if (deviceActions.forgetDevice.match(action)) {
            const deviceState = action.payload.device.state?.staticSessionId;
            const accounts = api
                .getState()
                .wallet.accounts.filter(a => a.deviceState === deviceState);
            api.dispatch(accountsActions.removeAccount(accounts));
        }

        // propagate action to reducers, this needs to happen before addTransaction is dispatched because it needs to have account in redux already
        next(action);

        if (accountsActions.createAccount.match(action)) {
            // gather transactions from account.create action
            const account = action.payload;
            api.dispatch(
                transactionsActions.addTransaction({
                    transactions: account.history.transactions || [],
                    account,
                    page: 1,
                    perPage: getTxsPerPage(account.networkType),
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

        if (isAnyOf(accountsActions.createAccount, accountsActions.updateAccount)(action)) {
            api.dispatch(subscribeBlockchainThunk({ symbol: action.payload.symbol }));
        }

        if (accountsActions.removeAccount.match(action)) {
            api.dispatch(unsubscribeBlockchainThunk(action.payload));
        }

        // Update custom backends
        if (blockchainActions.setBackend.match(action)) {
            api.dispatch(setCustomBackendThunk(action.payload.symbol));
        }

        const prevRouter = prevState.router;
        const nextRouter = api.getState().router;
        let resetReducers = action.type === deviceActions.selectDevice.type;

        if (
            deviceActions.forgetDevice.match(action) &&
            prevState.wallet.selectedAccount.account?.deviceState ===
                action.payload.device.state?.staticSessionId
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
            api.dispatch(tradingBuyActions.dispose());
            api.dispatch(stakeActions.dispose());
        }

        if (action.type === WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS) {
            const nextSelectedAccountKey = selectSelectedAccountKey(api.getState());
            api.dispatch(
                convertSendFormDraftsBtcAmountUnitsThunk({
                    selectedAccountKey: nextSelectedAccountKey,
                }),
            );
            api.dispatch(tradingCommonActions.convertDrafts());
        }

        api.dispatch(selectedAccountActions.syncSelectedAccount(action));

        return action;
    };

export default walletMiddleware;

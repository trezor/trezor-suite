import { type UnknownAction } from '@reduxjs/toolkit';
import { type MiddlewareAPI, type Dispatch as ReduxDispatch } from 'redux';

import { selectSelectedAccount, selectSelectedAccountKey } from '@suite/account';
import { routerLocationChange, selectRouteName, selectRouter } from '@suite/router';
import { deviceActions } from '@suite-common/device';
import { getTxsPerPage } from '@suite-common/suite-utils';
import { tradingActions } from '@suite-common/trading';
import {
    type SendRootState,
    type SyncAccountsWithBlockchainThunkState,
    WALLET_SETTINGS,
    accountsActions,
    blockchainActions,
    convertSendFormDraftsBtcAmountUnitsThunk,
    selectAccounts,
    selectAllNetworkSymbolsOfVisibleAccounts,
    selectNetworksWithPendingTxs,
    sendFormActions,
    setCustomBackendThunk,
    stakeActions,
    syncAccountsWithBlockchainThunk,
    transactionsActions,
} from '@suite-common/wallet-core';
import { type Dispatch } from '@trezor/redux-utils';

import { updateWindowVisibility } from '../../actions/suite/windowActions';
import { type SyncSelectedAccountThunkState } from '../../actions/wallet/selectedAccountActions';
import * as selectedAccountActions from '../../actions/wallet/selectedAccountActions';
import { type ConvertDraftsThunkState } from '../../actions/wallet/trading/tradingCommonActions';
import * as tradingCommonActions from '../../actions/wallet/trading/tradingCommonActions';
import { type WindowRootState, selectIsWindowVisible } from '../../reducers/suite/windowReducer';

type WalletMiddlewareState = SyncSelectedAccountThunkState &
    SyncAccountsWithBlockchainThunkState &
    ConvertDraftsThunkState &
    SendRootState &
    WindowRootState;

const walletMiddleware =
    (api: MiddlewareAPI<Dispatch, WalletMiddlewareState>) =>
    (next: ReduxDispatch<UnknownAction>) =>
    (action: UnknownAction): UnknownAction => {
        const prevState = api.getState();

        if (deviceActions.forgetDevice.match(action)) {
            const deviceState = action.payload.device.state?.staticSessionId;
            const accountsToRemove = selectAccounts(api.getState()).filter(
                a => a.deviceState === deviceState,
            );
            api.dispatch(accountsActions.removeAccount(accountsToRemove));
        }

        // propagate action to reducers, this needs to happen before addTransaction is dispatched because it needs to have account in redux already
        next(action);

        if (accountsActions.createAccount.match(action)) {
            // gather transactions from account.create action
            const { account } = action.payload;
            api.dispatch(
                transactionsActions.addTransaction({
                    transactions: account.history.transactions || [],
                    account,
                    page: 1,
                    perPage: getTxsPerPage(account.networkType),
                }),
            );
        }

        // Update custom backends
        if (blockchainActions.setBackend.match(action)) {
            api.dispatch(setCustomBackendThunk(action.payload.symbol));
        }

        /**
         * Make sure to update pending txs for visible accounts when the window is focused again.
         * Else the tx hangs there even though it has already been confirmed in the blockchain.
         * - Updating only specific account doesn't trigger update of receiver account balance / txs.
         */
        if (
            updateWindowVisibility.match(action) &&
            action.payload.isVisible &&
            !selectIsWindowVisible(prevState)
        ) {
            const state = api.getState();
            const visibleNetworks = new Set(selectAllNetworkSymbolsOfVisibleAccounts(state));
            const networksWithPendingTxs = selectNetworksWithPendingTxs(state);

            Array.from(networksWithPendingTxs)
                .filter(symbol => visibleNetworks.has(symbol))
                .forEach(symbol => {
                    api.dispatch(syncAccountsWithBlockchainThunk(symbol));
                });
        }

        const prevRouter = selectRouter(prevState);
        const nextRouter = selectRouter(api.getState());
        let resetReducers = action.type === deviceActions.selectDevice.type;

        if (
            deviceActions.forgetDevice.match(action) &&
            selectSelectedAccount(prevState)?.deviceState ===
                action.payload.device.state?.staticSessionId
        ) {
            // if currently selected account is related to forgotten device
            resetReducers = true;
        }

        if (prevRouter.app === 'wallet' && action.type === routerLocationChange.type) {
            // leaving wallet app or switching between accounts
            resetReducers =
                (nextRouter.app !== 'wallet' && !nextRouter.route?.isForegroundApp) ||
                (nextRouter.app === 'wallet' && nextRouter.hash !== prevRouter.hash);
        }
        if (resetReducers) {
            api.dispatch(accountsActions.disposeAccount());
            api.dispatch(sendFormActions.dispose());
            api.dispatch(tradingActions.setVerifiedAddress(undefined));
            api.dispatch(stakeActions.dispose());
            api.dispatch(stakeActions.clearAccountVotingDelegation());
        }

        if (action.type === WALLET_SETTINGS.SET_BITCOIN_AMOUNT_UNITS) {
            const nextSelectedAccountKey = selectSelectedAccountKey(api.getState());
            const suiteRouteName = selectRouteName(api.getState());
            api.dispatch(
                convertSendFormDraftsBtcAmountUnitsThunk({
                    selectedAccountKey: nextSelectedAccountKey,
                    isOnSendPage: suiteRouteName === 'wallet-send',
                }),
            );
            api.dispatch(tradingCommonActions.convertDraftsThunk());
        }

        api.dispatch(selectedAccountActions.syncSelectedAccountThunk(action));

        return action;
    };

export default walletMiddleware;

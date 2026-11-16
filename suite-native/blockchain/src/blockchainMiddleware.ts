import { isNetworkSymbol } from '@suite-common/wallet-config';
import {
    accountsActions,
    blockchainActions,
    onBlockchainDisconnectThunk,
    selectNetworksWithPendingTxs,
    setCustomBackendThunk,
    updateCardanoProtocolParametersThunk,
} from '@suite-common/wallet-core';
import { BLOCKCHAIN, isBlockchainEventOfType } from '@trezor/blockchain-core';
import { createMiddleware } from '@trezor/redux-utils';

import {
    onBlockchainConnectThunk,
    onBlockchainNotificationThunk,
    syncAccountsWithBlockchainThunk,
} from './blockchainThunks';
import { schedulePolledNetworkSync } from './polledNetworkSync';

// Be very careful when adding new stuff here, it could affect performance a lot on mobile
export const blockchainMiddleware = createMiddleware((action, { dispatch, next, getState }) => {
    if (isBlockchainEventOfType(action, BLOCKCHAIN.CONNECT)) {
        dispatch(onBlockchainConnectThunk({ symbol: action.payload.coin.shortcut }));
    } else if (isBlockchainEventOfType(action, BLOCKCHAIN.BLOCK)) {
        const networksWithPendingTransactions = selectNetworksWithPendingTxs(getState());
        const symbol = action.payload.coin.shortcut.toLowerCase();

        if (isNetworkSymbol(symbol) && networksWithPendingTransactions.has(symbol)) {
            dispatch(syncAccountsWithBlockchainThunk({ symbol }));
        }
        dispatch(updateCardanoProtocolParametersThunk(action.payload));
    } else if (isBlockchainEventOfType(action, BLOCKCHAIN.NOTIFICATION)) {
        dispatch(onBlockchainNotificationThunk(action.payload));
    } else if (isBlockchainEventOfType(action, BLOCKCHAIN.ERROR)) {
        dispatch(onBlockchainDisconnectThunk(action.payload));
    }

    next(action);

    // Each finished sync schedules the next one. The backend usually connects before discovery
    // creates the accounts, so the first account also starts the polling.
    if (syncAccountsWithBlockchainThunk.fulfilled.match(action)) {
        const { symbol } = action.meta.arg;
        schedulePolledNetworkSync({ symbol, dispatch, getState, shouldReplaceScheduled: true });
    } else if (
        accountsActions.createAccount.match(action) ||
        accountsActions.updateAccount.match(action)
    ) {
        const { symbol } = action.payload.account;
        schedulePolledNetworkSync({ symbol, dispatch, getState, shouldReplaceScheduled: false });
    }

    if (blockchainActions.setBackend.match(action)) {
        dispatch(setCustomBackendThunk(action.payload.symbol));
    }

    return action;
});

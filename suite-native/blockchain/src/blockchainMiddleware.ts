import { createMiddleware } from '@suite-common/redux-utils';
import { isNetworkSymbol } from '@suite-common/wallet-config';
import {
    type TransactionsRootState,
    blockchainActions,
    onBlockchainDisconnectThunk,
    selectAllPendingTransactions,
    setCustomBackendThunk,
} from '@suite-common/wallet-core';
import { BLOCKCHAIN as TREZOR_CONNECT_BLOCKCHAIN_ACTIONS } from '@trezor/connect';
import { typedObjectKeys } from '@trezor/utils';

import {
    onBlockchainConnectThunk,
    onBlockchainNotificationThunk,
    syncAccountsWithBlockchainThunk,
} from './blockchainThunks';

export const selectNetworksWithPendingTransactions = (state: TransactionsRootState) => {
    const pendingTransactions = selectAllPendingTransactions(state);

    return typedObjectKeys(pendingTransactions)
        .filter(accountKey => pendingTransactions[accountKey].length > 0)
        .map(accountKey => pendingTransactions[accountKey][0].symbol);
};

// Be very careful when adding new stuff here, it could affect performance a lot on mobile
export const blockchainMiddleware = createMiddleware((action, { dispatch, next, getState }) => {
    switch (action.type) {
        case TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.CONNECT:
            dispatch(onBlockchainConnectThunk({ symbol: action.payload.coin.shortcut }));

            break;
        case TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.BLOCK: {
            const networksWithPendingTransactions =
                selectNetworksWithPendingTransactions(getState());
            const symbol = action.payload.coin.shortcut.toLowerCase();

            if (isNetworkSymbol(symbol) && networksWithPendingTransactions.includes(symbol)) {
                dispatch(syncAccountsWithBlockchainThunk({ symbol }));
            }

            break;
        }
        case TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.NOTIFICATION:
            dispatch(onBlockchainNotificationThunk(action.payload));
            break;
        case TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.ERROR:
            dispatch(onBlockchainDisconnectThunk(action.payload));
            break;
        default:
            break;
    }

    next(action);

    if (blockchainActions.setBackend.match(action)) {
        dispatch(setCustomBackendThunk(action.payload.symbol));
    }

    return action;
});

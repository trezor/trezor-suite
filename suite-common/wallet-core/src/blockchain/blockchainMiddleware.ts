import {
    type BlockchainEvent,
    BLOCKCHAIN as TREZOR_CONNECT_BLOCKCHAIN_ACTIONS,
} from '@trezor/connect';
import { createMiddlewareWithExtraDeps } from '@trezor/redux-utils';

import {
    onBlockMinedThunk,
    onBlockchainConnectThunk,
    onBlockchainDisconnectThunk,
    onBlockchainNotificationThunk,
} from './blockchainThunks';

type BlockchainMiddlewareState = void;

export const prepareBlockchainMiddleware = createMiddlewareWithExtraDeps<
    void,
    BlockchainEvent,
    BlockchainMiddlewareState
>((action, { dispatch, next }) => {
    // propagate action to reducers
    next(action);

    switch (action.type) {
        case TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.CONNECT:
            dispatch(onBlockchainConnectThunk(action.payload.coin.shortcut));

            break;
        case TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.BLOCK:
            dispatch(onBlockMinedThunk(action.payload));
            break;
        case TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.NOTIFICATION:
            dispatch(onBlockchainNotificationThunk(action.payload));
            break;
        case TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.ERROR:
            dispatch(onBlockchainDisconnectThunk(action.payload));
            break;
        default:
            break;
    }

    return action;
});

import { BLOCKCHAIN, type BlockchainEvent } from '@trezor/blockchain-core';
import { createMiddlewareWithExtraDeps } from '@trezor/redux-utils';

import {
    onBlockMinedThunk,
    onBlockchainConnectThunk,
    onBlockchainDisconnectThunk,
    onBlockchainNotificationThunk,
    updateCardanoProtocolParametersThunk,
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
        case BLOCKCHAIN.CONNECT:
            dispatch(onBlockchainConnectThunk(action.payload.coin.shortcut));

            break;
        case BLOCKCHAIN.BLOCK:
            dispatch(onBlockMinedThunk(action.payload));
            dispatch(updateCardanoProtocolParametersThunk(action.payload));
            break;
        case BLOCKCHAIN.NOTIFICATION:
            dispatch(onBlockchainNotificationThunk(action.payload));
            break;
        case BLOCKCHAIN.ERROR:
            dispatch(onBlockchainDisconnectThunk(action.payload));
            break;
        default:
            break;
    }

    return action;
});

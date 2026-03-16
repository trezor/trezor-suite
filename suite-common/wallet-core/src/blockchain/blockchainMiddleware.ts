import { getUnixTime } from 'date-fns';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import {
    type BlockchainEvent,
    BLOCKCHAIN as TREZOR_CONNECT_BLOCKCHAIN_ACTIONS,
} from '@trezor/connect';

import {
    onBlockMinedThunk,
    onBlockchainConnectThunk,
    onBlockchainDisconnectThunk,
    onBlockchainNotificationThunk,
} from './blockchainThunks';

export const prepareBlockchainMiddleware = createMiddlewareWithExtraDeps(
    (action: BlockchainEvent, { dispatch, next, extra }) => {
        // propagate action to reducers
        next(action);

        const { cardanoValidatePendingTxOnBlock } = extra.thunks;

        switch (action.type) {
            case TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.CONNECT:
                dispatch(onBlockchainConnectThunk(action.payload.coin.shortcut));

                break;
            case TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.BLOCK:
                dispatch(onBlockMinedThunk(action.payload));
                // cardano stuff
                dispatch(
                    cardanoValidatePendingTxOnBlock({
                        block: action.payload,
                        timestamp: getUnixTime(new Date()),
                    }),
                );
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
    },
);

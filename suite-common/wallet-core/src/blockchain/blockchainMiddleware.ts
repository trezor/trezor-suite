import { getUnixTime } from 'date-fns';

import { createMiddlewareWithExtraDeps } from '@suite-common/redux-utils';
import { BlockchainEvent, BLOCKCHAIN as TREZOR_CONNECT_BLOCKCHAIN_ACTIONS } from '@trezor/connect';

import {
    onBlockMinedThunk,
    onBlockchainConnectThunk,
    onBlockchainDisconnectThunk,
    onBlockchainNotificationThunk,
} from './blockchainThunks';
import { updateFeeInfoThunk } from '../fees/feesThunks';

export const prepareBlockchainMiddleware = createMiddlewareWithExtraDeps(
    (action: BlockchainEvent, { dispatch, next, extra }) => {
        // propagate action to reducers
        next(action);

        const { cardanoValidatePendingTxOnBlock, cardanoFetchTrezorData } = extra.thunks;

        switch (action.type) {
            case TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.CONNECT:
                dispatch(onBlockchainConnectThunk(action.payload.coin.shortcut));

                // once suite connects to blockchain, fetch additional data required
                // for cardano staking if applicable
                if (['ADA', 'tADA'].includes(action.payload.coin.shortcut)) {
                    dispatch(
                        cardanoFetchTrezorData(action.payload.coin.shortcut as 'ADA' | 'tADA'),
                    );
                }
                break;
            case TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.BLOCK:
                dispatch(updateFeeInfoThunk({ networkSymbol: action.payload.coin.shortcut }));
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

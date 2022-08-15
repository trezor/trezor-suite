import { createMiddlewareWithExtraDependencies } from '@suite-common/redux-utils';
import {
    BLOCKCHAIN as TREZOR_CONNECT_BLOCKCHAIN_ACTIONS,
    BlockchainBlock,
    BlockchainEvent,
    BlockchainInfo,
} from '@trezor/connect';

import { onConnectThunk } from './blockchainThunks';
import { blockchainActions } from './blockchainSlice';

import { onBlockMinedThunk, onNotificationThunk, updateFeeInfoThunk } from '.';

export const blockchainMiddleware = createMiddlewareWithExtraDependencies(
    (action: BlockchainEvent, api) => {
        switch (action.type) {
            case TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.CONNECT:
                api.dispatch(onConnectThunk(action.payload.coin.shortcut));

                // once suite connects to blockchain, fetch additional data required
                // for cardano staking if applicable
                if (['ADA', 'tADA'].includes(action.payload.coin.shortcut)) {
                    api.dispatch(
                        cardanoStakingActions.fetchTrezorPools(
                            action.payload.coin.shortcut as 'ADA' | 'tADA',
                        ),
                    );
                }
                break;
            case TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.BLOCK:
                api.dispatch(updateFeeInfoThunk(action.payload.coin.shortcut));
                api.dispatch(onBlockMinedThunk(action.payload));
                // cardano stuff
                api.dispatch(validatePendingTxOnBlock(action.payload, getUnixTime(new Date())));
                break;
            case TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.NOTIFICATION:
                api.dispatch(onNotificationThunk(action.payload));
                break;
            case TREZOR_CONNECT_BLOCKCHAIN_ACTIONS.ERROR:
                api.dispatch(onNotificationThunk(action.payload));
                break;
            default:
                break;
        }
    },
);

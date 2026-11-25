import {
    type ConnectInitThunkDeps,
    type ConnectInitThunkState,
    connectInitThunk,
} from '@suite-common/connect-init';
import {
    type InitBlockchainThunkDeps,
    type InitBlockchainThunkState,
    initBlockchainThunk,
} from '@suite-common/wallet-core';
import { createThunk } from '@trezor/redux-utils';

import { APP_INIT_ACTION_PREFIX } from './appInitConstants';
import { ConnectAndBlockchainInitializationStatus } from './appTypes';

export type ConnectAndBlockchainInitThunkState = ConnectInitThunkState & InitBlockchainThunkState;

export type ConnectAndBlockchainInitThunkDeps = ConnectInitThunkDeps & InitBlockchainThunkDeps;

export const connectAndBlockchainInitThunk = createThunk<
    void,
    void,
    {
        state: ConnectAndBlockchainInitThunkState;
        extra: ConnectAndBlockchainInitThunkDeps;
        rejectValue: ConnectAndBlockchainInitializationStatus.Unavailable;
    }
>(
    `${APP_INIT_ACTION_PREFIX}/connectAndBlockchainInit`,
    async (_, { dispatch, rejectWithValue }) => {
        const connectResult = await dispatch(connectInitThunk());

        if (connectInitThunk.rejected.match(connectResult)) {
            console.error(`Connect init error: ${JSON.stringify(connectResult.error)}`);

            return rejectWithValue(ConnectAndBlockchainInitializationStatus.Unavailable);
        }

        const blockchainResult = await dispatch(initBlockchainThunk());

        if (initBlockchainThunk.rejected.match(blockchainResult)) {
            console.error(`Blockchain init error: ${JSON.stringify(blockchainResult.error)}`);

            return rejectWithValue(ConnectAndBlockchainInitializationStatus.Unavailable);
        }
    },
);

import {
    type ConnectInitThunkDeps,
    type ConnectInitThunkState,
    connectInitThunk,
} from '@suite-common/connect-init';
import { createThunk } from '@suite-common/redux-utils';
import {
    type InitBlockchainThunkDeps,
    type InitBlockchainThunkState,
    initBlockchainThunk,
} from '@suite-common/wallet-core';

import { APP_INIT_ACTION_PREFIX } from './appInitConstants';
import { ConnectAndBlockchainInitializationStatus } from './appTypes';

export type ConnectAndBlockchainInitThunkState = ConnectInitThunkState & InitBlockchainThunkState;

export type ConnectAndBlockchainInitThunkDeps = ConnectInitThunkDeps & InitBlockchainThunkDeps;

type ConnectAndBlockchainInitThunkError =
    | ConnectAndBlockchainInitializationStatus.ConnectError
    | ConnectAndBlockchainInitializationStatus.BlockchainError;

export const connectAndBlockchainInitThunk = createThunk<
    void,
    void,
    {
        state: ConnectAndBlockchainInitThunkState;
        extra: ConnectAndBlockchainInitThunkDeps;
        rejectValue: ConnectAndBlockchainInitThunkError;
    }
>(
    `${APP_INIT_ACTION_PREFIX}/connectAndBlockchainInit`,
    async (_, { dispatch, rejectWithValue }) => {
        const connectResult = await dispatch(connectInitThunk());

        if (connectInitThunk.rejected.match(connectResult)) {
            console.error(`Connect init error: ${JSON.stringify(connectResult.error)}`);

            return rejectWithValue(ConnectAndBlockchainInitializationStatus.ConnectError);
        }

        const blockchainResult = await dispatch(initBlockchainThunk());

        if (initBlockchainThunk.rejected.match(blockchainResult)) {
            console.error(`Blockchain init error: ${JSON.stringify(blockchainResult.error)}`);

            return rejectWithValue(ConnectAndBlockchainInitializationStatus.BlockchainError);
        }
    },
);

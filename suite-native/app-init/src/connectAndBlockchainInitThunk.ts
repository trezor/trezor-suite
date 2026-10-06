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

import { AppServicesInitializationStatus } from './appTypes';
import { dispatchAndLogStartupThunk } from './startupLogger';

const ACTION_PREFIX = '@suite-native/app';

export type ConnectAndBlockchainInitThunkState = ConnectInitThunkState & InitBlockchainThunkState;

export type ConnectAndBlockchainInitThunkDeps = ConnectInitThunkDeps & InitBlockchainThunkDeps;

type ConnectAndBlockchainInitializationError =
    AppServicesInitializationStatus.ConnectError | AppServicesInitializationStatus.BlockchainError;

export const connectAndBlockchainInitThunk = createThunk<
    void,
    void,
    {
        state: ConnectAndBlockchainInitThunkState;
        extra: ConnectAndBlockchainInitThunkDeps;
        rejectValue: ConnectAndBlockchainInitializationError;
    }
>(`${ACTION_PREFIX}/connectAndBlockchainInit`, async (_, { dispatch, rejectWithValue }) => {
    const connectResult = await dispatchAndLogStartupThunk('connectInitThunk', () =>
        dispatch(connectInitThunk()),
    );

    if (connectInitThunk.rejected.match(connectResult)) {
        console.error(`Connect init error: ${JSON.stringify(connectResult.error)}`);

        return rejectWithValue(AppServicesInitializationStatus.ConnectError);
    }

    const blockchainResult = await dispatchAndLogStartupThunk('initBlockchainThunk', () =>
        dispatch(initBlockchainThunk()),
    );

    if (initBlockchainThunk.rejected.match(blockchainResult)) {
        console.error(`Blockchain init error: ${JSON.stringify(blockchainResult.error)}`);

        return rejectWithValue(AppServicesInitializationStatus.BlockchainError);
    }
});

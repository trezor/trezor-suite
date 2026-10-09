import {
    type MessageSystemRootState,
    selectActiveKillswitchMessage,
} from '@suite-common/message-system';
import { createThunk } from '@suite-common/redux-utils';
import {
    type InitTokenDefinitionsThunkDeps,
    type InitTokenDefinitionsThunkState,
    periodicCheckTokenDefinitionsThunk,
} from '@suite-common/token-definitions';
import {
    type InitStakeDataThunkState,
    type PeriodicFetchFiatRatesThunkDeps,
    type PeriodicFetchFiatRatesThunkState,
    initStakeDataThunk,
    periodicFetchFiatRatesThunk,
    selectBaseCurrency,
} from '@suite-common/wallet-core';
import {
    type WalletConnectInitThunkDeps,
    type WalletConnectInitThunkState,
    walletConnectInitThunk,
} from '@suite-common/walletconnect';

import { APP_INIT_ACTION_PREFIX } from './appInitConstants';
import {
    type ConnectAndBlockchainInitializationError,
    type ConnectAndBlockchainInitializationResult,
    ConnectAndBlockchainInitializationStatus,
} from './appTypes';
import {
    type ConnectAndBlockchainInitThunkDeps,
    type ConnectAndBlockchainInitThunkState,
    connectAndBlockchainInitThunk,
} from './connectAndBlockchainInitThunk';

export type PostOnboardingInitThunkState = MessageSystemRootState &
    ConnectAndBlockchainInitThunkState &
    InitTokenDefinitionsThunkState &
    InitStakeDataThunkState &
    PeriodicFetchFiatRatesThunkState &
    WalletConnectInitThunkState;

export type PostOnboardingInitThunkDeps = ConnectAndBlockchainInitThunkDeps &
    InitTokenDefinitionsThunkDeps &
    PeriodicFetchFiatRatesThunkDeps &
    WalletConnectInitThunkDeps;

export const postOnboardingInitThunk = createThunk<
    ConnectAndBlockchainInitializationResult,
    void,
    {
        state: PostOnboardingInitThunkState;
        extra: PostOnboardingInitThunkDeps;
        rejectValue: ConnectAndBlockchainInitializationError;
    }
>(
    `${APP_INIT_ACTION_PREFIX}/postOnboardingInit`,
    async (_, { dispatch, getState, rejectWithValue }) => {
        // Do not initialize Connect or related services when message-system has an
        // app-wide killswitch.
        const activeKillswitchMessage = selectActiveKillswitchMessage(getState());
        if (activeKillswitchMessage) {
            return ConnectAndBlockchainInitializationStatus.Disabled;
        }

        const connectAndBlockchainResult = await dispatch(connectAndBlockchainInitThunk());

        dispatch(periodicCheckTokenDefinitionsThunk());
        dispatch(initStakeDataThunk());

        // These initializers could be skipped after
        // a Connect or blockchain failure if their dependent call sites were guarded individually.
        dispatch(
            periodicFetchFiatRatesThunk({
                rateType: 'current',
                localCurrency: selectBaseCurrency(getState()),
            }),
        );

        dispatch(walletConnectInitThunk());

        if (connectAndBlockchainInitThunk.rejected.match(connectAndBlockchainResult)) {
            return rejectWithValue(
                connectAndBlockchainResult.payload ??
                    ConnectAndBlockchainInitializationStatus.Error,
            );
        }

        return ConnectAndBlockchainInitializationStatus.Ready;
    },
);

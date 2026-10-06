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
    type CreateImportedDeviceThunkState,
    type InitStakeDataThunkState,
    type PeriodicFetchFiatRatesThunkDeps,
    type PeriodicFetchFiatRatesThunkState,
    createImportedDeviceThunk,
    initStakeDataThunk,
    periodicFetchFiatRatesThunk,
    selectBaseCurrency,
} from '@suite-common/wallet-core';
import {
    type WalletConnectInitThunkDeps,
    type WalletConnectInitThunkState,
    walletConnectInitThunk,
} from '@suite-common/walletconnect';

import {
    type AppServicesInitializationError,
    type AppServicesInitializationResult,
    AppServicesInitializationStatus,
} from './appTypes';
import {
    type ConnectAndBlockchainInitThunkDeps,
    type ConnectAndBlockchainInitThunkState,
    connectAndBlockchainInitThunk,
} from './connectAndBlockchainInitThunk';
import { dispatchAndLogStartupThunk } from './startupLogger';

const ACTION_PREFIX = '@suite-native/app';

export type PostOnboardingInitThunkState = MessageSystemRootState &
    ConnectAndBlockchainInitThunkState &
    InitTokenDefinitionsThunkState &
    InitStakeDataThunkState &
    PeriodicFetchFiatRatesThunkState &
    CreateImportedDeviceThunkState &
    WalletConnectInitThunkState;

export type PostOnboardingInitThunkDeps = ConnectAndBlockchainInitThunkDeps &
    InitTokenDefinitionsThunkDeps &
    PeriodicFetchFiatRatesThunkDeps &
    WalletConnectInitThunkDeps;

export const postOnboardingInitThunk = createThunk<
    AppServicesInitializationResult,
    void,
    {
        state: PostOnboardingInitThunkState;
        extra: PostOnboardingInitThunkDeps;
        rejectValue: AppServicesInitializationError;
    }
>(`${ACTION_PREFIX}/postOnboardingInit`, async (_, { dispatch, getState, rejectWithValue }) => {
    // Do not initialize Connect or anything else related to it, if there is an app-wide killswitch via message-system.
    const activeKillswitchMessage = selectActiveKillswitchMessage(getState());
    if (activeKillswitchMessage) {
        return AppServicesInitializationStatus.Disabled;
    }

    // Create Portfolio Tracker device before rendering the application shell.
    void dispatchAndLogStartupThunk('createImportedDeviceThunk', () =>
        dispatch(createImportedDeviceThunk()),
    );

    const connectAndBlockchainResult = await dispatchAndLogStartupThunk(
        'connectAndBlockchainInitThunk',
        () => dispatch(connectAndBlockchainInitThunk()),
    );

    void dispatchAndLogStartupThunk('periodicCheckTokenDefinitionsThunk', () =>
        dispatch(periodicCheckTokenDefinitionsThunk()),
    );
    void dispatchAndLogStartupThunk('initStakeDataThunk', () => dispatch(initStakeDataThunk()));

    // These initializers could be skipped after
    // a Connect or blockchain failure if their dependent call sites were guarded individually.
    void dispatchAndLogStartupThunk('periodicFetchFiatRatesThunk', () =>
        dispatch(
            periodicFetchFiatRatesThunk({
                rateType: 'current',
                localCurrency: selectBaseCurrency(getState()),
            }),
        ),
    );

    void dispatchAndLogStartupThunk('walletConnectInitThunk', () =>
        dispatch(walletConnectInitThunk()),
    );

    if (connectAndBlockchainInitThunk.rejected.match(connectAndBlockchainResult)) {
        return rejectWithValue(
            connectAndBlockchainResult.payload ?? AppServicesInitializationStatus.Error,
        );
    }

    return AppServicesInitializationStatus.Ready;
});

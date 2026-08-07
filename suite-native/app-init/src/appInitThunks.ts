import {
    type ConnectInitThunkDeps,
    type ConnectInitThunkState,
    connectInitThunk,
} from '@suite-common/connect-init';
import {
    defaultEarnYieldWorkerBaseUrl,
    earnYieldWorkerBaseUrl,
} from '@suite-common/earn-stablecoin-api';
import {
    type MessageSystemRootState,
    initMessageSystemThunk,
    prepareCachedEnvData,
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
    type InitBlockchainThunkDeps,
    type InitBlockchainThunkState,
    type InitStakeDataThunkState,
    type PeriodicFetchFiatRatesThunkDeps,
    type PeriodicFetchFiatRatesThunkState,
    createImportedDeviceThunk,
    initBlockchainThunk,
    initDevices,
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
    type InitAnalyticsThunkDeps,
    type InitAnalyticsThunkState,
    initAnalyticsThunk,
} from '@suite-native/analytics-redux';
import {
    type SettingsSliceRootState,
    selectEarnYieldWorkerBaseUrl,
    selectIsOnboardingFinished,
} from '@suite-native/settings';
import { setIsAppReady } from '@suite-native/state';

const ACTION_PREFIX = '@suite-native/app';

type PostOnboardingInitThunkState = ConnectInitThunkState &
    InitBlockchainThunkState &
    InitTokenDefinitionsThunkState &
    InitStakeDataThunkState &
    PeriodicFetchFiatRatesThunkState &
    CreateImportedDeviceThunkState &
    WalletConnectInitThunkState;
type PostOnboardingInitThunkDeps = ConnectInitThunkDeps &
    InitBlockchainThunkDeps &
    InitTokenDefinitionsThunkDeps &
    PeriodicFetchFiatRatesThunkDeps &
    WalletConnectInitThunkDeps;

export const postOnboardingInit = createThunk<
    void,
    void,
    { state: PostOnboardingInitThunkState; extra: PostOnboardingInitThunkDeps }
>(`${ACTION_PREFIX}/postOnboardingInit`, async (_, { dispatch, getState }) => {
    // Do not initialize Connect or anything else related to it, if there is an app-wide killswitch via message-system.
    const activeKillswitchMessage = selectActiveKillswitchMessage(getState());
    if (activeKillswitchMessage) return;

    try {
        await dispatch(connectInitThunk()).unwrap();
    } catch (error) {
        console.error(`Connect init error: ${JSON.stringify(error)}`);
    }

    try {
        // Needs to be finished before any TrezorConnect.blockchain* calls.
        await dispatch(initBlockchainThunk()).unwrap();
    } catch (error) {
        console.error(`Blockchain init error: ${JSON.stringify(error)}`);
    }

    dispatch(periodicCheckTokenDefinitionsThunk());
    dispatch(initStakeDataThunk());

    dispatch(
        periodicFetchFiatRatesThunk({
            rateType: 'current',
            localCurrency: selectBaseCurrency(getState()),
        }),
    );

    // Create Portfolio Tracker device if it doesn't exist
    dispatch(createImportedDeviceThunk());

    dispatch(walletConnectInitThunk());
});

type ApplicationInitThunkState = SettingsSliceRootState &
    MessageSystemRootState &
    InitAnalyticsThunkState &
    PostOnboardingInitThunkState;
type ApplicationInitThunkDeps = InitAnalyticsThunkDeps & PostOnboardingInitThunkDeps;

export const applicationInit = createThunk<
    void,
    void,
    { state: ApplicationInitThunkState; extra: ApplicationInitThunkDeps }
>(`${ACTION_PREFIX}/applicationInit`, async (_, { dispatch, getState }) => {
    await prepareCachedEnvData();

    // apply the earn yield worker base url from debug settings (or the default for this build)
    earnYieldWorkerBaseUrl.set(
        selectEarnYieldWorkerBaseUrl(getState()) ?? defaultEarnYieldWorkerBaseUrl,
    );

    dispatch(initAnalyticsThunk());
    dispatch(initMessageSystemThunk());

    // Select latest remembered device or Portfolio Tracker device.
    dispatch(initDevices());

    if (selectIsOnboardingFinished(getState())) {
        await dispatch(postOnboardingInit());
    }

    // Tell the application to render
    dispatch(setIsAppReady(true));
});

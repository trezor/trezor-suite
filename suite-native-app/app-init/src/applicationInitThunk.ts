import { type DeviceRootState } from '@suite-common/device';
import {
    defaultEarnYieldWorkerBaseUrl,
    earnYieldWorkerBaseUrl,
} from '@suite-common/earn-stablecoin-api';
import {
    defaultEarnStakingWorkerBaseUrl,
    earnStakingWorkerBaseUrl,
} from '@suite-common/earn-staking-api';
import {
    type MessageSystemRootState,
    initMessageSystemThunk,
    prepareCachedEnvData,
} from '@suite-common/message-system';
import { createImportedDeviceThunk, initDevicesThunk } from '@suite-common/wallet-core';
import {
    type InitAnalyticsThunkDeps,
    type InitAnalyticsThunkState,
    initAnalyticsThunk,
} from '@suite-native/analytics-redux';
import {
    type SettingsSliceRootState,
    selectEarnStakingWorkerBaseUrl,
    selectEarnYieldWorkerBaseUrl,
    selectIsOnboardingFinished,
} from '@suite-native/settings';
import { createThunk } from '@trezor/redux-utils';

import { APP_INIT_ACTION_PREFIX } from './appInitConstants';
import {
    type PostOnboardingInitThunkDeps,
    type PostOnboardingInitThunkState,
    postOnboardingInitThunk,
} from './postOnboardingInitThunk';

export type ApplicationInitThunkState = SettingsSliceRootState &
    MessageSystemRootState &
    InitAnalyticsThunkState &
    DeviceRootState &
    PostOnboardingInitThunkState;

export type ApplicationInitThunkDeps = InitAnalyticsThunkDeps & PostOnboardingInitThunkDeps;

export const applicationInitThunk = createThunk<
    void,
    void,
    { state: ApplicationInitThunkState; extra: ApplicationInitThunkDeps }
>(`${APP_INIT_ACTION_PREFIX}/applicationInit`, async (_, { dispatch, getState }) => {
    await prepareCachedEnvData();

    // Apply the earn worker base URLs from debug settings (or the defaults for this build).
    earnYieldWorkerBaseUrl.set(
        selectEarnYieldWorkerBaseUrl(getState()) ?? defaultEarnYieldWorkerBaseUrl,
    );
    earnStakingWorkerBaseUrl.set(
        selectEarnStakingWorkerBaseUrl(getState()) ?? defaultEarnStakingWorkerBaseUrl,
    );

    dispatch(initAnalyticsThunk());
    dispatch(initMessageSystemThunk());

    // Select the latest remembered device or Portfolio Tracker device.
    await dispatch(initDevicesThunk());
    await dispatch(createImportedDeviceThunk());

    if (selectIsOnboardingFinished(getState())) {
        // Keep app bootstrap unblocked while post-onboarding initialization continues.
        void dispatch(postOnboardingInitThunk());
    }
});

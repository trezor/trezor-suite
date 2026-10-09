import {
    defaultEarnYieldWorkerBaseUrl,
    earnYieldWorkerBaseUrl,
} from '@suite-common/earn-stablecoin-api';
import {
    type MessageSystemRootState,
    initMessageSystemThunk,
    prepareCachedEnvData,
} from '@suite-common/message-system';
import { createThunk } from '@suite-common/redux-utils';
import {
    type CreateImportedDeviceThunkState,
    type InitDevicesThunkState,
    createImportedDeviceThunk,
    initDevicesThunk,
} from '@suite-common/wallet-core';
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

import { APP_INIT_ACTION_PREFIX } from './appInitConstants';
import {
    type PostOnboardingInitThunkDeps,
    type PostOnboardingInitThunkState,
    postOnboardingInitThunk,
} from './postOnboardingInitThunk';

export type ApplicationInitThunkState = SettingsSliceRootState &
    MessageSystemRootState &
    InitAnalyticsThunkState &
    InitDevicesThunkState &
    CreateImportedDeviceThunkState &
    PostOnboardingInitThunkState;

export type ApplicationInitThunkDeps = InitAnalyticsThunkDeps & PostOnboardingInitThunkDeps;

export const applicationInitThunk = createThunk<
    void,
    void,
    { state: ApplicationInitThunkState; extra: ApplicationInitThunkDeps }
>(`${APP_INIT_ACTION_PREFIX}/applicationInit`, async (_, { dispatch, getState }) => {
    await prepareCachedEnvData();

    // Apply the earn yield worker base URL from debug settings (or the default for this build).
    earnYieldWorkerBaseUrl.set(
        selectEarnYieldWorkerBaseUrl(getState()) ?? defaultEarnYieldWorkerBaseUrl,
    );

    dispatch(initAnalyticsThunk());
    dispatch(initMessageSystemThunk());

    // Select the latest remembered device or Portfolio Tracker device.
    await dispatch(initDevicesThunk());
    await dispatch(createImportedDeviceThunk());

    if (selectIsOnboardingFinished(getState())) {
        dispatch(postOnboardingInitThunk());
    }
});

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
import { initDevicesThunk } from '@suite-common/wallet-core';
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

import {
    type PostOnboardingInitThunkDeps,
    type PostOnboardingInitThunkState,
    postOnboardingInitThunk,
} from './postOnboardingInitThunk';

const ACTION_PREFIX = '@suite-native/app';

type ApplicationInitThunkState = SettingsSliceRootState &
    MessageSystemRootState &
    InitAnalyticsThunkState &
    PostOnboardingInitThunkState;

type ApplicationInitThunkDeps = InitAnalyticsThunkDeps & PostOnboardingInitThunkDeps;

export const applicationInitThunk = createThunk<
    void,
    void,
    { state: ApplicationInitThunkState; extra: ApplicationInitThunkDeps }
>(`${ACTION_PREFIX}/applicationInit`, async (_, { dispatch, getState }) => {
    await prepareCachedEnvData();

    // Apply the earn yield worker base URL from debug settings (or the default for this build).
    earnYieldWorkerBaseUrl.set(
        selectEarnYieldWorkerBaseUrl(getState()) ?? defaultEarnYieldWorkerBaseUrl,
    );

    dispatch(initAnalyticsThunk());
    dispatch(initMessageSystemThunk());

    // Select the latest remembered device or Portfolio Tracker device.
    dispatch(initDevicesThunk());

    if (selectIsOnboardingFinished(getState())) {
        dispatch(postOnboardingInitThunk());
    }
});

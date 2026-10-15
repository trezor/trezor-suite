import { defaultEarnYieldWorkerBaseUrl } from '@suite-common/earn-stablecoin-api';
import { initMessageSystemThunk } from '@suite-common/message-system';
import { createImportedDeviceThunk, initDevicesThunk } from '@suite-common/wallet-core';
import { initAnalyticsThunk } from '@suite-native/analytics-redux';
import {
    type SettingsSliceRootState,
    selectEarnYieldWorkerBaseUrl,
    selectIsOnboardingFinished,
} from '@suite-native/settings';
import { type DispatchDep } from '@trezor/redux-utils';
import { type Result, ok } from '@trezor/type-utils';

import { appInitActions } from './appInitSlice';
import { type PostOnboardingInitDep } from './postOnboardingInitThunk';

export type ApplicationInitState = SettingsSliceRootState;

export type PrepareCachedEnvDataError = {
    type: 'PrepareCachedEnvDataError';
    cause: unknown;
};

export type ApplicationInitDeps = DispatchDep &
    PostOnboardingInitDep & {
        getState: () => ApplicationInitState;
        prepareCachedEnvData: () => Promise<Result<void, PrepareCachedEnvDataError>>;
        setEarnYieldWorkerBaseUrl: (url: string) => void;
    };

export type ApplicationInit = () => Promise<Result<void, PrepareCachedEnvDataError>>;

export type ApplicationInitDep = { applicationInit: ApplicationInit };

export const createApplicationInit =
    (deps: ApplicationInitDeps): ApplicationInit =>
    async () => {
        const cachedEnvDataResult = await deps.prepareCachedEnvData();
        if (!cachedEnvDataResult.success) {
            return cachedEnvDataResult;
        }

        // Apply the earn yield worker base URL from debug settings (or the default for this build).
        deps.setEarnYieldWorkerBaseUrl(
            selectEarnYieldWorkerBaseUrl(deps.getState()) ?? defaultEarnYieldWorkerBaseUrl,
        );

        deps.dispatch(initAnalyticsThunk());
        deps.dispatch(initMessageSystemThunk());

        // Select the latest remembered device or Portfolio Tracker device.
        await deps.dispatch(initDevicesThunk());
        await deps.dispatch(createImportedDeviceThunk());

        if (selectIsOnboardingFinished(deps.getState())) {
            // Keep app bootstrap unblocked while post-onboarding initialization continues.
            void deps.postOnboardingInit();
        }

        deps.dispatch(appInitActions.applicationInitFinished());

        return ok();
    };

export const injectApplicationInit = (services: ApplicationInitDep): ApplicationInitDep => ({
    applicationInit: services.applicationInit,
});

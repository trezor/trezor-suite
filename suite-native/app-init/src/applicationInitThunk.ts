import { type EarnYieldWorkerBaseUrl } from '@suite-common/earn-stablecoin-defs';
import { type Result, ok } from '@trezor/type-utils';

import { type PostOnboardingInitDep } from './postOnboardingInitThunk';

export type PrepareCachedEnvDataError = {
    type: 'PrepareCachedEnvDataError';
    cause: unknown;
};

export type ApplicationInitDeps = PostOnboardingInitDep & {
    prepareCachedEnvData: () => Promise<Result<void, PrepareCachedEnvDataError>>;
    defaultEarnYieldWorkerBaseUrl: EarnYieldWorkerBaseUrl;
    getEarnYieldWorkerBaseUrl: () => EarnYieldWorkerBaseUrl | undefined;
    setEarnYieldWorkerBaseUrl: (url: EarnYieldWorkerBaseUrl) => void;
    initAnalytics: () => void;
    initMessageSystem: () => void;
    initDevices: () => Promise<void>;
    createImportedDevice: () => Promise<void>;
    getIsOnboardingFinished: () => boolean;
    onApplicationInitFinished: () => void;
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
            deps.getEarnYieldWorkerBaseUrl() ?? deps.defaultEarnYieldWorkerBaseUrl,
        );

        deps.initAnalytics();
        deps.initMessageSystem();

        // Select the latest remembered device or Portfolio Tracker device.
        await deps.initDevices();
        await deps.createImportedDevice();

        if (deps.getIsOnboardingFinished()) {
            // Keep app bootstrap unblocked while post-onboarding initialization continues.
            void deps.postOnboardingInit();
        }

        deps.onApplicationInitFinished();

        return ok();
    };

export const injectApplicationInit = (services: ApplicationInitDep): ApplicationInitDep => ({
    applicationInit: services.applicationInit,
});

import { type ServiceWorkerUpdate } from './control/serviceWorkerControl';

type ShouldShowServiceWorkerUpdateBannerParams = {
    waitingUpdate: ServiceWorkerUpdate | null;
    /** The Debug settings option that shows the banner outside production builds. */
    isUpdatePromptEnabled: boolean;
    isDiscoveryRunning: boolean;
    isProductionBuild: boolean;
    runningVersion: string;
};

/**
 * Develop deploys many times a day, so outside production builds the banner is a debug option.
 * Production asks only for a new version, and like desktop never during a discovery.
 */
export const shouldShowServiceWorkerUpdateBanner = ({
    waitingUpdate,
    isUpdatePromptEnabled,
    isDiscoveryRunning,
    isProductionBuild,
    runningVersion,
}: ShouldShowServiceWorkerUpdateBannerParams) => {
    if (waitingUpdate === null || isDiscoveryRunning) {
        return false;
    }

    if (!isProductionBuild) {
        return isUpdatePromptEnabled;
    }

    // A waiting worker that does not answer counts as a new version.
    return waitingUpdate.buildInfo?.version !== runningVersion;
};

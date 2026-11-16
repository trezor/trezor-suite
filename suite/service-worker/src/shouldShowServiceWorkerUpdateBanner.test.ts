import { type ServiceWorkerUpdate } from './control/serviceWorkerControl';
import { shouldShowServiceWorkerUpdateBanner } from './shouldShowServiceWorkerUpdateBanner';

const RUNNING_VERSION = '26.11.0';

const waitingUpdateOfVersion = (version: string): ServiceWorkerUpdate => ({
    buildInfo: { version, commit: 'abc123', precachedEntryCount: 527, isCachingEnabled: true },
});

const params = {
    waitingUpdate: waitingUpdateOfVersion('26.12.0'),
    isUpdatePromptEnabled: false,
    isDiscoveryRunning: false,
    isProductionBuild: true,
    runningVersion: RUNNING_VERSION,
};

describe(shouldShowServiceWorkerUpdateBanner.name, () => {
    it('shows a new version waiting on a production build', () => {
        expect(shouldShowServiceWorkerUpdateBanner(params)).toBe(true);
    });

    it('shows a waiting worker that does not report its build on a production build', () => {
        expect(
            shouldShowServiceWorkerUpdateBanner({ ...params, waitingUpdate: { buildInfo: null } }),
        ).toBe(true);
    });

    it('hides a redeploy of the running version on a production build', () => {
        expect(
            shouldShowServiceWorkerUpdateBanner({
                ...params,
                waitingUpdate: waitingUpdateOfVersion(RUNNING_VERSION),
            }),
        ).toBe(false);
    });

    it('shows any waiting worker outside production only with the debug option', () => {
        const nonProductionParams = {
            ...params,
            waitingUpdate: waitingUpdateOfVersion(RUNNING_VERSION),
            isProductionBuild: false,
        };

        expect(shouldShowServiceWorkerUpdateBanner(nonProductionParams)).toBe(false);
        expect(
            shouldShowServiceWorkerUpdateBanner({
                ...nonProductionParams,
                isUpdatePromptEnabled: true,
            }),
        ).toBe(true);
    });

    it('hides the banner while nothing waits or a discovery runs', () => {
        expect(shouldShowServiceWorkerUpdateBanner({ ...params, waitingUpdate: null })).toBe(false);
        expect(shouldShowServiceWorkerUpdateBanner({ ...params, isDiscoveryRunning: true })).toBe(
            false,
        );
    });
});

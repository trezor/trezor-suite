import { Translation } from '@suite/intl';
import {
    type ServiceWorkerUpdateRootState,
    injectServiceWorkerControl,
    selectServiceWorkerWaitingUpdate,
    shouldShowServiceWorkerUpdateBanner,
} from '@suite/service-worker';
import {
    type SuiteSettingsRootState,
    selectIsServiceWorkerUpdatePromptEnabled,
} from '@suite/settings';
import { type DeviceRootState } from '@suite-common/device';
import { type DiscoveryRootState, selectHasRunningDiscovery } from '@suite-common/wallet-core';
import { useServices } from '@trezor/dependency-injection';
import { getSuiteVersion, isCodesignBuild } from '@trezor/env-utils';
import { ArrowDownIcon } from '@trezor/icons';
import { SidebarBanner } from '@trezor/product-components';

type ServiceWorkerUpdateSidebarBannerRootState = ServiceWorkerUpdateRootState &
    SuiteSettingsRootState &
    DeviceRootState &
    DiscoveryRootState;

export const selectShouldShowServiceWorkerUpdateSidebarBanner = (
    state: ServiceWorkerUpdateSidebarBannerRootState,
) =>
    shouldShowServiceWorkerUpdateBanner({
        waitingUpdate: selectServiceWorkerWaitingUpdate(state),
        isUpdatePromptEnabled: selectIsServiceWorkerUpdatePromptEnabled(state),
        isDiscoveryRunning: selectHasRunningDiscovery(state),
        isProductionBuild: isCodesignBuild(),
        runningVersion: getSuiteVersion(),
    });

type ServiceWorkerUpdateSidebarBannerProps = {
    onDismiss: () => void;
};

/** Web's counterpart of desktop's banner for a downloaded update: the new worker waits until the page asks. */
export const ServiceWorkerUpdateSidebarBanner = ({
    onDismiss,
}: ServiceWorkerUpdateSidebarBannerProps) => {
    const { serviceWorkerControl } = useServices(injectServiceWorkerControl);

    const handleUpdate = async () => {
        const result = await serviceWorkerControl.activateWaiting();

        if (!result.success) {
            console.warn('Service worker update failed:', result.error);
        }
    };

    return (
        <SidebarBanner
            animate={['drop', 'shake']}
            heading={<Translation id="TR_QUICK_ACTION_UPDATE_POPOVER_APP_DOWNLOADED" />}
            ctaLabel={<Translation id="TR_QUICK_ACTION_UPDATE_POPOVER_CLICK_TO_START_UPDATE" />}
            closeLabel={<Translation id="TR_DISMISS" />}
            icon={ArrowDownIcon}
            onClick={handleUpdate}
            onClose={onDismiss}
            data-testid="@notification/service-worker-update-banner"
        />
    );
};

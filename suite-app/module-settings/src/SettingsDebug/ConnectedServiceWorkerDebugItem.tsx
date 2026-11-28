import { useSelector } from 'react-redux';

import { ServiceWorkerDebugItem, injectServiceWorkerControl } from '@suite/service-worker';
import {
    selectIsServiceWorkerDevLogsEnabled,
    selectIsServiceWorkerEnabled,
    selectIsServiceWorkerUpdatePromptEnabled,
    suiteSettingsActions,
} from '@suite/settings';
import { isDevEnv } from '@suite-common/suite-utils';
import { useServices } from '@trezor/dependency-injection';
import { injectDispatch } from '@trezor/redux-utils';

export const ConnectedServiceWorkerDebugItem = () => {
    const isServiceWorkerEnabled = useSelector(selectIsServiceWorkerEnabled);
    const isUpdatePromptEnabled = useSelector(selectIsServiceWorkerUpdatePromptEnabled);
    const isDevLogsEnabled = useSelector(selectIsServiceWorkerDevLogsEnabled);
    const { dispatch, serviceWorkerControl } = useServices(
        injectDispatch,
        injectServiceWorkerControl,
    );

    const handleEnabledChange = (isEnabled: boolean) =>
        dispatch(suiteSettingsActions.setDebugMode({ isServiceWorkerEnabled: isEnabled }));

    const handleUpdatePromptEnabledChange = (isEnabled: boolean) =>
        dispatch(
            suiteSettingsActions.setDebugMode({ isServiceWorkerUpdatePromptEnabled: isEnabled }),
        );

    const handleDevLogsEnabledChange = (isEnabled: boolean) =>
        dispatch(suiteSettingsActions.setDebugMode({ isServiceWorkerDevLogsEnabled: isEnabled }));

    return (
        <ServiceWorkerDebugItem
            isEnabled={isServiceWorkerEnabled}
            onEnabledChange={handleEnabledChange}
            isUpdatePromptEnabled={isUpdatePromptEnabled}
            onUpdatePromptEnabledChange={handleUpdatePromptEnabledChange}
            isDevLogsAvailable={isDevEnv}
            isDevLogsEnabled={isDevLogsEnabled}
            onDevLogsEnabledChange={handleDevLogsEnabledChange}
            serviceWorkerControl={serviceWorkerControl}
        />
    );
};

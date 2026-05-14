import { type JSX, useCallback, useEffect } from 'react';

import { AppUpdateEventStatus, asTypedDesktopAnalytics, events } from '@suite/analytics';
import {
    UpdateState,
    availableThunk,
    desktopUpdateActions,
    errorThunk,
    getAppUpdatePayload,
    notAvailableThunk,
    readyThunk,
    selectDesktopUpdate,
} from '@suite/desktop-update';
import { desktopApi } from '@trezor/suite-desktop-api';
import { isArrayMember } from '@trezor/utils';

import { useDispatch, useSelector } from 'src/hooks/suite';
import { useAnalytics } from 'src/support/useAnalytics';

import { Available } from './DesktopUpdater/Available';
import { Downloading } from './DesktopUpdater/Downloading';
import { EarlyAccessDisable } from './DesktopUpdater/EarlyAccessDisable';
import { EarlyAccessEnable } from './DesktopUpdater/EarlyAccessEnable';
import { JustUpdated } from './DesktopUpdater/JustUpdated';
import { Ready } from './DesktopUpdater/Ready';

// incidentally the same UI is used, but if they diverge in the future, we can change it here
const VersionInfoModal = JustUpdated;

const alwaysOpenStates = [
    // Allow to open Early Access model even after updater error (when desktopUpdate.latest is undefined).
    UpdateState.EarlyAccessDisable,
    UpdateState.EarlyAccessEnable,
    // JustUpdated is also always open, because closing it advances the state
    UpdateState.JustUpdated,
] satisfies UpdateState[];

export const DesktopUpdater = () => {
    const dispatch = useDispatch();
    const desktopUpdate = useSelector(selectDesktopUpdate);
    const analytics = useAnalytics();
    const desktopUpdateState = desktopUpdate.state;

    useEffect(() => {
        desktopApi.on('update/allow-prerelease', params =>
            dispatch(desktopUpdateActions.allowPrerelease(params)),
        );
        desktopApi.on('update/set-automatic-update-enabled', isEnabled =>
            dispatch(desktopUpdateActions.setAutomaticUpdates({ isEnabled })),
        );

        if (!desktopUpdate.enabled) {
            return;
        }

        desktopApi.on('update/checking', () => dispatch(desktopUpdateActions.checking()));
        desktopApi.on('update/available', params => dispatch(availableThunk(params)));
        desktopApi.on('update/not-available', params => dispatch(notAvailableThunk(params)));
        desktopApi.on('update/downloaded', params => dispatch(readyThunk(params)));
        desktopApi.on('update/downloading', params =>
            dispatch(desktopUpdateActions.downloading(params)),
        );
        desktopApi.on('update/error', () => dispatch(errorThunk()));

        // Initial check for updates
        desktopApi.checkForUpdates({ isManual: false });
        // Check for updates every hour
        const checkForUpdatesInterval = setInterval(
            () => {
                desktopApi.checkForUpdates({ isManual: false });
            },
            60 * 60 * 1000,
        );

        return () => clearInterval(checkForUpdatesInterval);
    }, [desktopUpdate.enabled, dispatch]);

    const hideWindow = useCallback(() => {
        dispatch(desktopUpdateActions.setIsUpdateModalVisible(false));

        const payload = getAppUpdatePayload({
            status: AppUpdateEventStatus.Closed,
            earlyAccessProgram: desktopUpdate.allowPrerelease,
            updateInfo: desktopUpdate.latest,
        });

        asTypedDesktopAnalytics(analytics).report({
            type: events.appUpdateEvent.name,
            payload,
        });
    }, [dispatch, desktopUpdate.allowPrerelease, desktopUpdate.latest, analytics]);

    const hideVersionInfoModal = () => {
        dispatch(desktopUpdateActions.setIsVersionInfoModalVisible(false));
    };

    if (desktopUpdate.isVersionInfoModalVisible) {
        return <VersionInfoModal onCancel={hideVersionInfoModal} />;
    }

    const isUpdateInfoAvailable = desktopUpdate.latest !== undefined;
    const isAlwaysOpenState = isArrayMember(desktopUpdateState, alwaysOpenStates);
    const isVisible = desktopUpdate.isModalVisible && (isAlwaysOpenState || isUpdateInfoAvailable);

    const updateModalMap: Record<UpdateState, JSX.Element | null> = {
        'early-access-disable': <EarlyAccessDisable hideWindow={hideWindow} />,
        'early-access-enable': <EarlyAccessEnable hideWindow={hideWindow} />,
        'just-updated': <JustUpdated onCancel={hideWindow} />,
        'not-available': null,
        available: <Available onCancel={hideWindow} latest={desktopUpdate.latest} />,
        checking: null,
        downloading: <Downloading hideWindow={hideWindow} progress={desktopUpdate.progress} />,
        ready: <Ready hideWindow={hideWindow} />,
    };

    if (!isVisible) return null;

    return updateModalMap[desktopUpdateState];
};

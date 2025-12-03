import { JSX, useCallback, useEffect, useMemo } from 'react';

import { AppUpdateEventStatus, EventType, analytics } from '@trezor/suite-analytics';
import { desktopApi } from '@trezor/suite-desktop-api';

import {
    allowPrerelease,
    available,
    checking,
    downloading,
    error,
    notAvailable,
    ready,
    setAutomaticUpdates,
    setUpdateModalVisibility,
} from 'src/actions/suite/desktopUpdateActions';
import { useDispatch, useSelector } from 'src/hooks/suite';
import { UpdateState, selectDesktopUpdate } from 'src/reducers/suite/desktopUpdateReducer';
import { getAppUpdatePayload } from 'src/utils/suite/analytics';

import { Available } from './DesktopUpdater/Available';
import { Downloading } from './DesktopUpdater/Downloading';
import { EarlyAccessDisable } from './DesktopUpdater/EarlyAccessDisable';
import { EarlyAccessEnable } from './DesktopUpdater/EarlyAccessEnable';
import { JustUpdated } from './DesktopUpdater/JustUpdated';
import { Ready } from './DesktopUpdater/Ready';

export const DesktopUpdater = () => {
    const dispatch = useDispatch();
    const desktopUpdate = useSelector(selectDesktopUpdate);

    const desktopUpdateState = desktopUpdate.state;

    useEffect(() => {
        desktopApi.on('update/allow-prerelease', params => dispatch(allowPrerelease(params)));
        desktopApi.on('update/set-automatic-update-enabled', isEnabled =>
            dispatch(setAutomaticUpdates({ isEnabled })),
        );

        if (!desktopUpdate.enabled) {
            return;
        }

        desktopApi.on('update/checking', () => dispatch(checking()));
        desktopApi.on('update/available', params => dispatch(available(params)));
        desktopApi.on('update/not-available', params => dispatch(notAvailable(params)));
        desktopApi.on('update/downloaded', params => dispatch(ready(params)));
        desktopApi.on('update/downloading', params => dispatch(downloading(params)));
        desktopApi.on('update/error', () => dispatch(error()));

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
        dispatch(setUpdateModalVisibility('hidden'));

        const payload = getAppUpdatePayload({
            status: AppUpdateEventStatus.Closed,
            earlyAccessProgram: desktopUpdate.allowPrerelease,
            updateInfo: desktopUpdate.latest,
        });
        analytics.report({
            type: EventType.AppUpdate,
            payload,
        });
    }, [dispatch, desktopUpdate.allowPrerelease, desktopUpdate.latest]);

    const isVisible = useMemo(() => {
        // Not displayed as a modal
        if (desktopUpdate.modalVisibility !== 'maximized') {
            return false;
        }

        // Non visible states
        if ([UpdateState.Checking, UpdateState.NotAvailable].includes(desktopUpdateState)) {
            return false;
        }

        const isHackyModalOpen = [
            UpdateState.EarlyAccessDisable,
            UpdateState.EarlyAccessEnable,
            UpdateState.JustUpdated,
        ].includes(desktopUpdateState);

        // Enable to setup Early Access even after updater error (when desktopUpdate.latest is undefined).
        return isHackyModalOpen || desktopUpdate.latest !== undefined;
    }, [desktopUpdate.modalVisibility, desktopUpdateState, desktopUpdate.latest]);

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

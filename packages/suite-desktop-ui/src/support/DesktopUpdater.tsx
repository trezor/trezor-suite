import { useCallback, useEffect, useMemo, ReactNode } from 'react';

import { analytics, AppUpdateEventStatus, EventType } from '@trezor/suite-analytics';
import { desktopApi } from '@trezor/suite-desktop-api';

import { useDispatch, useSelector } from 'src/hooks/suite';
import {
    allowPrerelease,
    setAutomaticUpdates,
    checking,
    available,
    notAvailable,
    ready,
    downloading,
    error,
    setUpdateModalVisibility,
} from 'src/actions/suite/desktopUpdateActions';
import { UpdateState } from 'src/reducers/suite/desktopUpdateReducer';
import { ModalContextProvider } from 'src/support/suite/ModalContext';
import { getAppUpdatePayload } from 'src/utils/suite/analytics';

import { Available } from './DesktopUpdater/Available';
import { Downloading } from './DesktopUpdater/Downloading';
import { Ready } from './DesktopUpdater/Ready';
import { EarlyAccessEnable } from './DesktopUpdater/EarlyAccessEnable';
import { EarlyAccessDisable } from './DesktopUpdater/EarlyAccessDisable';

interface DesktopUpdaterProps {
    children: ReactNode;
}

export const DesktopUpdater = ({ children }: DesktopUpdaterProps) => {
    const dispatch = useDispatch();
    const { desktopUpdate } = useSelector(state => state);

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
        desktopApi.on('update/error', params => dispatch(error(params)));

        // Initial check for updates
        desktopApi.checkForUpdates();
        // Check for updates every hour
        const checkForUpdatesInterval = setInterval(
            () => {
                desktopApi.checkForUpdates();
            },
            60 * 60 * 1000,
        );

        return () => clearInterval(checkForUpdatesInterval);
    }, [desktopUpdate.enabled, dispatch]);

    const hideWindow = useCallback(() => {
        dispatch(setUpdateModalVisibility('hidden'));

        const payload = getAppUpdatePayload(
            AppUpdateEventStatus.Closed,
            desktopUpdate.allowPrerelease,
            desktopUpdate.latest,
        );
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

        const isEarlyAccessState = [
            UpdateState.EarlyAccessDisable,
            UpdateState.EarlyAccessEnable,
        ].includes(desktopUpdateState);

        // Enable to setup Early Access even after updater error (when desktopUpdate.latest is undefined).
        if (!isEarlyAccessState && !desktopUpdate.latest) {
            return false;
        }

        return true;
    }, [desktopUpdate.modalVisibility, desktopUpdateState, desktopUpdate.latest]);

    const getUpdateModal = () => {
        switch (desktopUpdateState) {
            case UpdateState.EarlyAccessEnable:
                return <EarlyAccessEnable hideWindow={hideWindow} />;
            case UpdateState.EarlyAccessDisable:
                return <EarlyAccessDisable hideWindow={hideWindow} />;
            case UpdateState.Available:
                return (
                    <Available
                        onCancel={hideWindow}
                        latest={desktopUpdate.latest}
                        isAutomaticUpdateEnabled={desktopUpdate.isAutomaticUpdateEnabled}
                    />
                );
            case UpdateState.Downloading:
                return <Downloading hideWindow={hideWindow} progress={desktopUpdate.progress} />;
            case UpdateState.Ready:
                return <Ready hideWindow={hideWindow} />;
            default:
                return null;
        }
    };

    return (
        <>
            {isVisible && getUpdateModal()}
            <ModalContextProvider isDisabled={isVisible}>{children}</ModalContextProvider>
        </>
    );
};

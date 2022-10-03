import React, { useCallback, useEffect, useMemo } from 'react';

import { useActions, useSelector } from '@suite-hooks';
import * as desktopUpdateActions from '@suite-actions/desktopUpdateActions';
import { UpdateState } from '@suite-reducers/desktopUpdateReducer';
import { ModalContextProvider } from '@suite-support/ModalContext';
import { getAppUpdatePayload } from '@suite-utils/analytics';

import { analytics, AppUpdateEventStatus, EventType } from '@trezor/suite-analytics';
import { desktopApi } from '@trezor/suite-desktop-api';

import { Available } from './DesktopUpdater/Available';
import { Downloading } from './DesktopUpdater/Downloading';
import { Ready } from './DesktopUpdater/Ready';
import { EarlyAccessEnable } from './DesktopUpdater/EarlyAccessEnable';
import { EarlyAccessDisable } from './DesktopUpdater/EarlyAccessDisable';

interface DesktopUpdaterProps {
    children: React.ReactNode;
}

export const DesktopUpdater = ({ children }: DesktopUpdaterProps) => {
    const {
        checking,
        available,
        notAvailable,
        downloading,
        ready,
        error,
        setUpdateWindow,
        allowPrerelease,
    } = useActions({
        checking: desktopUpdateActions.checking,
        available: desktopUpdateActions.available,
        notAvailable: desktopUpdateActions.notAvailable,
        downloading: desktopUpdateActions.downloading,
        ready: desktopUpdateActions.ready,
        error: desktopUpdateActions.error,
        setUpdateWindow: desktopUpdateActions.setUpdateWindow,
        allowPrerelease: desktopUpdateActions.allowPrerelease,
    });
    const { desktopUpdate } = useSelector(state => state);

    useEffect(() => {
        desktopApi.on('update/allow-prerelease', allowPrerelease);

        if (!desktopUpdate.enabled) {
            return;
        }
        desktopApi.on('update/checking', checking);
        desktopApi.on('update/available', available);
        desktopApi.on('update/not-available', notAvailable);
        desktopApi.on('update/downloaded', ready);
        desktopApi.on('update/downloading', downloading);
        desktopApi.on('update/error', error);

        // Initial check for updates
        desktopApi.checkForUpdates();
        // Check for updates every hour
        const checkForUpdatesInterval = setInterval(() => {
            desktopApi.checkForUpdates();
        }, 60 * 60 * 1000);

        return () => clearInterval(checkForUpdatesInterval);
    }, [
        available,
        checking,
        downloading,
        notAvailable,
        ready,
        error,
        desktopUpdate.enabled,
        allowPrerelease,
    ]);

    const hideWindow = useCallback(() => {
        setUpdateWindow('hidden');

        const payload = getAppUpdatePayload(
            AppUpdateEventStatus.Closed,
            desktopUpdate.allowPrerelease,
            desktopUpdate.latest,
        );
        analytics.report({
            type: EventType.AppUpdate,
            payload,
        });
    }, [setUpdateWindow, desktopUpdate.latest, desktopUpdate.allowPrerelease]);

    const isVisible = useMemo(() => {
        // Not displayed as a modal
        if (desktopUpdate.window !== 'maximized') {
            return false;
        }

        // Non visible states
        if ([UpdateState.Checking, UpdateState.NotAvailable].includes(desktopUpdate.state)) {
            return false;
        }

        const isEarlyAccessState = [
            UpdateState.EarlyAccessDisable,
            UpdateState.EarlyAccessEnable,
        ].includes(desktopUpdate.state);

        // Enable to setup Early Access even after updater error (when desktopUpdate.latest is undefined).
        if (!isEarlyAccessState && !desktopUpdate.latest) {
            return false;
        }

        return true;
    }, [desktopUpdate.window, desktopUpdate.state, desktopUpdate.latest]);

    const getUpdateModal = () => {
        switch (desktopUpdate.state) {
            case UpdateState.EarlyAccessEnable:
                return <EarlyAccessEnable hideWindow={hideWindow} />;
            case UpdateState.EarlyAccessDisable:
                return <EarlyAccessDisable hideWindow={hideWindow} />;
            case UpdateState.Available:
                return <Available hideWindow={hideWindow} latest={desktopUpdate.latest} />;
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

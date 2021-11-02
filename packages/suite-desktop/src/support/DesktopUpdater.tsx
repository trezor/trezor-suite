import React, { useCallback, useEffect, useMemo } from 'react';
import { useActions, useSelector } from '@suite-hooks';
import * as desktopUpdateActions from '@suite-actions/desktopUpdateActions';

import Available from './DesktopUpdater/Available';
import Downloading from './DesktopUpdater/Downloading';
import Ready from './DesktopUpdater/Ready';

interface Props {
    setIsUpdateVisible: (isVisible: boolean) => void;
}

const DesktopUpdater = ({ setIsUpdateVisible }: Props) => {
    const {
        enable,
        checking,
        available,
        notAvailable,
        downloading,
        ready,
        error,
        newVersionFirstRun,
        setUpdateWindow,
    } = useActions({
        enable: desktopUpdateActions.enable,
        checking: desktopUpdateActions.checking,
        available: desktopUpdateActions.available,
        notAvailable: desktopUpdateActions.notAvailable,
        downloading: desktopUpdateActions.downloading,
        ready: desktopUpdateActions.ready,
        error: desktopUpdateActions.error,
        setUpdateWindow: desktopUpdateActions.setUpdateWindow,
        newVersionFirstRun: desktopUpdateActions.newVersionFirstRun,
    });
    const desktopUpdate = useSelector(state => state.desktopUpdate);

    useEffect(() => {
        if (!desktopUpdate.enabled) {
            window.desktopApi!.on('update/enable', enable);
            return;
        }
        window.desktopApi!.on('update/checking', checking);
        window.desktopApi!.on('update/available', available);
        window.desktopApi!.on('update/not-available', notAvailable);
        window.desktopApi!.on('update/downloaded', ready);
        window.desktopApi!.on('update/downloading', downloading);
        window.desktopApi!.on('update/error', error);
        window.desktopApi!.on('update/new-version-first-run', newVersionFirstRun);

        // Initial check for updates
        window.desktopApi!.checkForUpdates();
        // Check for updates every hour
        setInterval(() => window.desktopApi!.checkForUpdates(), 60 * 60 * 1000);
    }, [
        available,
        checking,
        downloading,
        notAvailable,
        ready,
        error,
        enable,
        newVersionFirstRun,
        desktopUpdate.enabled,
    ]);

    const hideWindow = useCallback(() => setUpdateWindow('hidden'), [setUpdateWindow]);
    /* Not used for now
    const toggleMaxMinWindow = useCallback(
        () => setUpdateWindow(desktopUpdate.window === 'maximized' ? 'minimized' : 'maximized'),
        [desktopUpdate.window, setUpdateWindow],
    );
    */

    const isVisible = useMemo(() => {
        // Not displayed as a modal
        if (desktopUpdate.window !== 'maximized') {
            return false;
        }

        // Non visible states
        if (['checking', 'not-available'].includes(desktopUpdate.state)) {
            return false;
        }

        if (!desktopUpdate.latest) {
            return false;
        }

        return true;
    }, [desktopUpdate.window, desktopUpdate.state, desktopUpdate.latest]);

    useEffect(() => setIsUpdateVisible(isVisible), [setIsUpdateVisible, isVisible]);

    if (!isVisible) {
        return null;
    }

    //
    // TODO: Design alternative modal for minimized view
    //

    switch (desktopUpdate.state) {
        case 'available':
            return <Available hideWindow={hideWindow} latest={desktopUpdate.latest} />;
        case 'downloading':
            return <Downloading hideWindow={hideWindow} progress={desktopUpdate.progress} />;
        case 'ready':
            return <Ready hideWindow={hideWindow} />;
        default:
            return null;
    }
};

export default DesktopUpdater;

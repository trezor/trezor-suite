import {
    UpdateState,
    downloadThunk,
    installUpdateThunk,
    selectDesktopUpdate,
} from '@suite/desktop-update';
import { Translation } from '@suite/intl';
import { Button } from '@trezor/components';
import { desktopApi } from '@trezor/suite-desktop-api';

import { useDispatch, useSelector } from 'src/hooks/suite';

/**
 * Turns the newest release in the list into a call to action. Rendered on desktop only — the web app
 * always runs the latest version, so there is nothing for the user to update.
 */
export const ReleaseNotesUpdateButton = () => {
    const desktopUpdate = useSelector(selectDesktopUpdate);

    const dispatch = useDispatch();

    if (!desktopUpdate.enabled) return null;

    const downloadUpdate = () => {
        dispatch(downloadThunk());
        desktopApi.downloadUpdate();
    };

    const installUpdate = () => dispatch(installUpdateThunk({ installNow: true }));

    const checkForUpdates = () => desktopApi.checkForUpdates({ isManual: true });

    const commonProps = { size: 'small', intent: 'brand' } as const;

    if (desktopUpdate.state === UpdateState.Available) {
        return (
            <Button {...commonProps} onClick={downloadUpdate}>
                <Translation id="TR_UPDATE_MODAL_START_DOWNLOAD" />
            </Button>
        );
    }

    if (desktopUpdate.state === UpdateState.Downloading) {
        return (
            <Button {...commonProps} isDisabled>
                <Translation id="SETTINGS_UPDATE_DOWNLOADING" />
            </Button>
        );
    }

    if (desktopUpdate.state === UpdateState.Ready) {
        return (
            <Button {...commonProps} onClick={installUpdate}>
                <Translation id="SETTINGS_UPDATE_READY" />
            </Button>
        );
    }

    if (desktopUpdate.state === UpdateState.Checking) {
        return (
            <Button {...commonProps} isDisabled>
                <Translation id="SETTINGS_UPDATE_CHECKING" />
            </Button>
        );
    }

    // The manifest knows about a newer release the updater has not picked up yet.
    return (
        <Button {...commonProps} onClick={checkForUpdates}>
            <Translation id="SETTINGS_UPDATE_CHECK" />
        </Button>
    );
};

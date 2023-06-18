import { analytics, AppUpdateEventStatus, EventType } from '@trezor/suite-analytics';

import { DESKTOP_UPDATE } from 'src/actions/suite/constants';
import { Dispatch, GetState } from 'src/types/suite';
import { UpdateState, UpdateWindow } from 'src/reducers/suite/desktopUpdateReducer';
import { getAppUpdatePayload } from 'src/utils/suite/analytics';

import { desktopApi, UpdateInfo, UpdateProgress } from '@trezor/suite-desktop-api';
import { notificationsActions } from '@suite-common/toast-notifications';

export type DesktopUpdateAction =
    | { type: typeof DESKTOP_UPDATE.CHECKING }
    | { type: typeof DESKTOP_UPDATE.AVAILABLE; payload: UpdateInfo }
    | { type: typeof DESKTOP_UPDATE.NOT_AVAILABLE; payload?: UpdateInfo }
    | { type: typeof DESKTOP_UPDATE.DOWNLOAD }
    | { type: typeof DESKTOP_UPDATE.DOWNLOADING; payload: UpdateProgress }
    | { type: typeof DESKTOP_UPDATE.READY; payload: UpdateInfo }
    | { type: typeof DESKTOP_UPDATE.WINDOW; payload: UpdateWindow }
    | { type: typeof DESKTOP_UPDATE.OPEN_EARLY_ACCESS_ENABLE }
    | { type: typeof DESKTOP_UPDATE.OPEN_EARLY_ACCESS_DISABLE }
    | { type: typeof DESKTOP_UPDATE.ALLOW_PRERELEASE; payload: boolean };

export const checking = (): DesktopUpdateAction => ({ type: DESKTOP_UPDATE.CHECKING });

export const available = (info: UpdateInfo) => (dispatch: Dispatch, getState: GetState) => {
    const { allowPrerelease } = getState().desktopUpdate;

    const payload = getAppUpdatePayload(AppUpdateEventStatus.Available, allowPrerelease, info);
    analytics.report({
        type: EventType.AppUpdate,
        payload,
    });

    dispatch({ type: DESKTOP_UPDATE.AVAILABLE, payload: info });
};

export const notAvailable = (info: UpdateInfo) => (dispatch: Dispatch) => {
    if (info.isManualCheck) {
        dispatch(notificationsActions.addToast({ type: 'auto-updater-no-new' }));
    }

    dispatch({
        type: DESKTOP_UPDATE.NOT_AVAILABLE,
        payload: info,
    });
};

export const download = () => (dispatch: Dispatch, getState: GetState) => {
    const { latest, allowPrerelease } = getState().desktopUpdate;

    const payload = getAppUpdatePayload(AppUpdateEventStatus.Download, allowPrerelease, latest);
    analytics.report({
        type: EventType.AppUpdate,
        payload,
    });

    dispatch({
        type: DESKTOP_UPDATE.DOWNLOAD,
    });
};

export const downloading = (progress: UpdateProgress): DesktopUpdateAction => ({
    type: DESKTOP_UPDATE.DOWNLOADING,
    payload: progress,
});

export const ready = (info: UpdateInfo) => (dispatch: Dispatch, getState: GetState) => {
    const { latest, allowPrerelease } = getState().desktopUpdate;

    // update can fail even if it was downloaded successfully
    // TODO: Update successful status from electron layer
    const payload = getAppUpdatePayload(AppUpdateEventStatus.Downloaded, allowPrerelease, latest);
    analytics.report({
        type: EventType.AppUpdate,
        payload,
    });
    dispatch({
        type: DESKTOP_UPDATE.READY,
        payload: info,
    });
};

export const installUpdate =
    (shouldInstallOnQuit?: boolean) => (_: Dispatch, getState: GetState) => {
        const { desktopUpdate } = getState();

        const payload = getAppUpdatePayload(
            shouldInstallOnQuit
                ? AppUpdateEventStatus.InstallOnQuit
                : AppUpdateEventStatus.InstallAndRestart,
            desktopUpdate.allowPrerelease,
            desktopUpdate.latest,
        );
        analytics.report({
            type: EventType.AppUpdate,
            payload,
        });

        // auto-updater is by default configured to update on quit 'autoUpdater.autoInstallOnAppQuit = true'
        if (!shouldInstallOnQuit) {
            desktopApi.installUpdate();
        }
    };

export const error = (err: Error) => (dispatch: Dispatch, getState: GetState) => {
    // TODO: Properly display error
    console.error('auto-updater', err);

    const { state, latest, allowPrerelease } = getState().desktopUpdate;

    // Ignore displaying errors while checking
    if (state !== UpdateState.Checking) {
        dispatch(notificationsActions.addToast({ type: 'auto-updater-error', state }));

        const payload = getAppUpdatePayload(AppUpdateEventStatus.Error, allowPrerelease, latest);
        analytics.report({
            type: EventType.AppUpdate,
            payload,
        });
    }

    dispatch({
        type: DESKTOP_UPDATE.NOT_AVAILABLE,
    });
};

export const setUpdateWindow = (win: UpdateWindow): DesktopUpdateAction => ({
    type: DESKTOP_UPDATE.WINDOW,
    payload: win,
});

export const openEarlyAccessSetup = (earlyAccessEnabled: boolean): DesktopUpdateAction => ({
    type: earlyAccessEnabled
        ? DESKTOP_UPDATE.OPEN_EARLY_ACCESS_DISABLE
        : DESKTOP_UPDATE.OPEN_EARLY_ACCESS_ENABLE,
});

export const allowPrerelease = (allowPrerelease: boolean): DesktopUpdateAction => ({
    type: DESKTOP_UPDATE.ALLOW_PRERELEASE,
    payload: allowPrerelease,
});

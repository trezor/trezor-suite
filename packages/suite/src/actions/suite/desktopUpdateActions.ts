import { AppUpdateEventStatus, asTypedDesktopAnalytics, events } from '@suite/analytics';
import { type ExtraDependencies } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type UpdateInfo, type UpdateProgress, desktopApi } from '@trezor/suite-desktop-api';

import { DESKTOP_UPDATE } from 'src/actions/suite/constants';
import { UpdateState } from 'src/reducers/suite/desktopUpdateReducer';
import { type Dispatch, type GetState } from 'src/types/suite';
import { getAppUpdatePayload } from 'src/utils/suite/analytics';

export type DesktopUpdateAction =
    | { type: typeof DESKTOP_UPDATE.CHECKING }
    | { type: typeof DESKTOP_UPDATE.AVAILABLE; payload: UpdateInfo }
    | { type: typeof DESKTOP_UPDATE.NOT_AVAILABLE; payload?: UpdateInfo }
    | { type: typeof DESKTOP_UPDATE.DOWNLOAD }
    | { type: typeof DESKTOP_UPDATE.DOWNLOADING; payload: UpdateProgress }
    | { type: typeof DESKTOP_UPDATE.READY; payload: UpdateInfo }
    | { type: typeof DESKTOP_UPDATE.MODAL_VISIBILITY; payload: boolean }
    | { type: typeof DESKTOP_UPDATE.VERSION_INFO_MODAL_VISIBILITY; payload: boolean }
    | { type: typeof DESKTOP_UPDATE.OPEN_EARLY_ACCESS_ENABLE }
    | { type: typeof DESKTOP_UPDATE.OPEN_EARLY_ACCESS_DISABLE }
    | { type: typeof DESKTOP_UPDATE.ALLOW_PRERELEASE; payload: boolean }
    | { type: typeof DESKTOP_UPDATE.SET_AUTOMATIC_UPDATES; payload: { isEnabled: boolean } }
    | { type: typeof DESKTOP_UPDATE.JUST_UPDATED };

export const checking = (): DesktopUpdateAction => ({ type: DESKTOP_UPDATE.CHECKING });

export const available =
    (info: UpdateInfo) => (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { allowPrerelease } = getState().desktopUpdate;

        const payload = getAppUpdatePayload({
            status: AppUpdateEventStatus.Available,
            earlyAccessProgram: allowPrerelease,
            updateInfo: info,
        });
        asTypedDesktopAnalytics(extra.services.analytics).report({
            type: events.appUpdateEvent.name,
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

export const download =
    () => (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { latest, allowPrerelease } = getState().desktopUpdate;

        const payload = getAppUpdatePayload({
            status: AppUpdateEventStatus.Download,
            earlyAccessProgram: allowPrerelease,
            updateInfo: latest,
        });
        asTypedDesktopAnalytics(extra.services.analytics).report({
            type: events.appUpdateEvent.name,
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

export const justUpdated = (): DesktopUpdateAction => ({
    type: DESKTOP_UPDATE.JUST_UPDATED,
});

export const ready =
    (info: UpdateInfo) => (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { latest, allowPrerelease } = getState().desktopUpdate;

        // update can fail even if it was downloaded successfully
        // TODO: Update successful status from electron layer
        const payload = getAppUpdatePayload({
            status: AppUpdateEventStatus.Downloaded,
            earlyAccessProgram: allowPrerelease,
            updateInfo: latest,
        });
        asTypedDesktopAnalytics(extra.services.analytics).report({
            type: events.appUpdateEvent.name,
            payload,
        });
        dispatch({
            type: DESKTOP_UPDATE.READY,
            payload: info,
        });
    };

export const installUpdate =
    ({ installNow }: { installNow: boolean }) =>
    (_: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        const { desktopUpdate } = getState();

        const payload = getAppUpdatePayload({
            status: installNow
                ? AppUpdateEventStatus.InstallAndRestart
                : AppUpdateEventStatus.InstallOnQuit,
            earlyAccessProgram: desktopUpdate.allowPrerelease,
            updateInfo: desktopUpdate.latest,
            isAutoUpdated: desktopUpdate.isAutomaticUpdateEnabled,
        });

        asTypedDesktopAnalytics(extra.services.analytics).report({
            type: events.appUpdateEvent.name,
            payload,
        });

        // auto-updater is by default configured to update on quit 'autoUpdater.autoInstallOnAppQuit = true'
        if (installNow) {
            desktopApi.installUpdate();
        } else {
            // To make sure, the update is installed on quit as it may have been disabled
            // by switching off the auto-update (silent-update)
            desktopApi.setAutoInstallOnAppQuit();
        }
    };

export const error = () => (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
    const { state, latest, allowPrerelease } = getState().desktopUpdate;

    // Ignore displaying errors while checking
    if (state !== UpdateState.Checking) {
        dispatch(notificationsActions.addToast({ type: 'auto-updater-error', state }));

        const payload = getAppUpdatePayload({
            status: AppUpdateEventStatus.Error,
            earlyAccessProgram: allowPrerelease,
            updateInfo: latest,
        });
        asTypedDesktopAnalytics(extra.services.analytics).report({
            type: events.appUpdateEvent.name,
            payload,
        });
    }

    dispatch({
        type: DESKTOP_UPDATE.NOT_AVAILABLE,
    });
};

export const setIsUpdateModalVisible = (isModalVisible: boolean): DesktopUpdateAction => ({
    type: DESKTOP_UPDATE.MODAL_VISIBILITY,
    payload: isModalVisible,
});

export const setIsVersionInfoModalVisible = (isModalVisible: boolean): DesktopUpdateAction => ({
    type: DESKTOP_UPDATE.VERSION_INFO_MODAL_VISIBILITY,
    payload: isModalVisible,
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

export const setAutomaticUpdates = ({
    isEnabled,
}: {
    isEnabled: boolean;
}): DesktopUpdateAction => ({
    type: DESKTOP_UPDATE.SET_AUTOMATIC_UPDATES,
    payload: { isEnabled },
});

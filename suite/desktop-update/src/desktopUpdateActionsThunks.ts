import { type Dispatch } from 'redux';

import { AppUpdateEventStatus, type DesktopAnalyticsDep, events } from '@suite/analytics';
import { type WithServices } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type UpdateInfo, desktopApi } from '@trezor/suite-desktop-api';

import { getAppUpdatePayload } from './appUpdateAnalytics';
import {
    type DesktopUpdateRootState,
    UpdateState,
    desktopUpdateActions,
} from './desktopUpdateReducer';

type AvailableThunkState = DesktopUpdateRootState;
type AvailableThunkDeps = WithServices<DesktopAnalyticsDep>;

export const availableThunk =
    (info: UpdateInfo) =>
    (dispatch: Dispatch, getState: () => AvailableThunkState, extra: AvailableThunkDeps) => {
        // eslint-disable-next-line no-restricted-syntax
        const { allowPrerelease } = getState().desktopUpdate;

        const payload = getAppUpdatePayload({
            status: AppUpdateEventStatus.Available,
            earlyAccessProgram: allowPrerelease,
            updateInfo: info,
        });
        extra.services.analytics.report({
            type: events.appUpdateEvent.name,
            payload,
        });

        dispatch(desktopUpdateActions.available(info));
    };

export const notAvailableThunk = (info: UpdateInfo) => (dispatch: Dispatch) => {
    if (info.isManualCheck) {
        dispatch(notificationsActions.addToast({ type: 'auto-updater-no-new' }));
    }

    dispatch(desktopUpdateActions.notAvailable(info));
};

type DownloadThunkState = DesktopUpdateRootState;
type DownloadThunkDeps = WithServices<DesktopAnalyticsDep>;

export const downloadThunk =
    () => (dispatch: Dispatch, getState: () => DownloadThunkState, extra: DownloadThunkDeps) => {
        // eslint-disable-next-line no-restricted-syntax
        const { latest, allowPrerelease } = getState().desktopUpdate;

        const payload = getAppUpdatePayload({
            status: AppUpdateEventStatus.Download,
            earlyAccessProgram: allowPrerelease,
            updateInfo: latest,
        });
        extra.services.analytics.report({
            type: events.appUpdateEvent.name,
            payload,
        });

        dispatch(desktopUpdateActions.download());
    };

type ReadyThunkState = DesktopUpdateRootState;
type ReadyThunkDeps = WithServices<DesktopAnalyticsDep>;

export const readyThunk =
    (info: UpdateInfo) =>
    (dispatch: Dispatch, getState: () => ReadyThunkState, extra: ReadyThunkDeps) => {
        // eslint-disable-next-line no-restricted-syntax
        const { latest, allowPrerelease } = getState().desktopUpdate;

        // update can fail even if it was downloaded successfully
        // TODO: Update successful status from electron layer
        const payload = getAppUpdatePayload({
            status: AppUpdateEventStatus.Downloaded,
            earlyAccessProgram: allowPrerelease,
            updateInfo: latest,
        });
        extra.services.analytics.report({
            type: events.appUpdateEvent.name,
            payload,
        });

        dispatch(desktopUpdateActions.ready(info));
    };

type InstallUpdateThunkState = DesktopUpdateRootState;
type InstallUpdateThunkDeps = WithServices<DesktopAnalyticsDep>;

export const installUpdateThunk =
    ({ installNow }: { installNow: boolean }) =>
    (_: Dispatch, getState: () => InstallUpdateThunkState, extra: InstallUpdateThunkDeps) => {
        // eslint-disable-next-line no-restricted-syntax
        const { desktopUpdate } = getState();

        const payload = getAppUpdatePayload({
            status: installNow
                ? AppUpdateEventStatus.InstallAndRestart
                : AppUpdateEventStatus.InstallOnQuit,
            earlyAccessProgram: desktopUpdate.allowPrerelease,
            updateInfo: desktopUpdate.latest,
            isAutoUpdated: desktopUpdate.isAutomaticUpdateEnabled,
        });

        extra.services.analytics.report({
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

type ErrorThunkState = DesktopUpdateRootState;
type ErrorThunkDeps = WithServices<DesktopAnalyticsDep>;

export const errorThunk =
    () => (dispatch: Dispatch, getState: () => ErrorThunkState, extra: ErrorThunkDeps) => {
        // eslint-disable-next-line no-restricted-syntax
        const { state, latest, allowPrerelease } = getState().desktopUpdate;

        // Ignore displaying errors while checking
        if (state !== UpdateState.Checking) {
            dispatch(notificationsActions.addToast({ type: 'auto-updater-error', state }));

            const payload = getAppUpdatePayload({
                status: AppUpdateEventStatus.Error,
                earlyAccessProgram: allowPrerelease,
                updateInfo: latest,
            });
            extra.services.analytics.report({
                type: events.appUpdateEvent.name,
                payload,
            });
        }

        dispatch(desktopUpdateActions.notAvailable());
    };

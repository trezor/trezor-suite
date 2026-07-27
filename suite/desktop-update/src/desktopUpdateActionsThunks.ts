import { type AnyAction } from 'redux';
import { type ThunkDispatch } from 'redux-thunk';

import { AppUpdateEventStatus, asTypedDesktopAnalytics, events } from '@suite/analytics';
import { type ExtraDependencies } from '@suite-common/redux-utils';
import { notificationsActions } from '@suite-common/toast-notifications';
import { type UpdateInfo, desktopApi } from '@trezor/suite-desktop-api';

import { getAppUpdatePayload } from './appUpdateAnalytics';
import {
    type DesktopUpdateRootState,
    UpdateState,
    desktopUpdateActions,
} from './desktopUpdateReducer';

type Dispatch = ThunkDispatch<DesktopUpdateRootState, ExtraDependencies, AnyAction>;
type GetState = () => DesktopUpdateRootState;

export const availableThunk =
    (info: UpdateInfo) => (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        // eslint-disable-next-line no-restricted-syntax
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

        dispatch(desktopUpdateActions.available(info));
    };

export const notAvailableThunk = (info: UpdateInfo) => (dispatch: Dispatch) => {
    if (info.isManualCheck) {
        dispatch(notificationsActions.addToast({ type: 'auto-updater-no-new' }));
    }

    dispatch(desktopUpdateActions.notAvailable(info));
};

export const downloadThunk =
    () => (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        // eslint-disable-next-line no-restricted-syntax
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

        dispatch(desktopUpdateActions.download());
    };

export const readyThunk =
    (info: UpdateInfo) => (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
        // eslint-disable-next-line no-restricted-syntax
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

        dispatch(desktopUpdateActions.ready(info));
    };

export const installUpdateThunk =
    ({ installNow }: { installNow: boolean }) =>
    (_: Dispatch, getState: GetState, extra: ExtraDependencies) => {
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

export const errorThunk =
    () => (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => {
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
            asTypedDesktopAnalytics(extra.services.analytics).report({
                type: events.appUpdateEvent.name,
                payload,
            });
        }

        dispatch(desktopUpdateActions.notAvailable());
    };

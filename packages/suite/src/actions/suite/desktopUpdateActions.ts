import { DESKTOP_UPDATE } from '@suite-actions/constants';
import { addToast } from '@suite-actions/notificationActions';
import { Dispatch, GetState } from '@suite-types';
import { UpdateInfo, UpdateProgress, UpdateWindow } from '@suite-types/desktop';
import { UpdateState } from '@suite-reducers/desktopUpdateReducer';

export type DesktopUpdateAction =
    | { type: typeof DESKTOP_UPDATE.ENABLE }
    | { type: typeof DESKTOP_UPDATE.CHECKING }
    | { type: typeof DESKTOP_UPDATE.AVAILABLE; payload: UpdateInfo }
    | { type: typeof DESKTOP_UPDATE.NOT_AVAILABLE; payload?: UpdateInfo }
    | { type: typeof DESKTOP_UPDATE.DOWNLOADING; payload: Partial<UpdateProgress> }
    | { type: typeof DESKTOP_UPDATE.READY; payload: UpdateInfo }
    | { type: typeof DESKTOP_UPDATE.WINDOW; payload: UpdateWindow }
    | { type: typeof DESKTOP_UPDATE.OPEN_EARLY_ACCESS_SETUP }
    | { type: typeof DESKTOP_UPDATE.ALLOW_PRERELEASE; payload: boolean };

export const enable = (): DesktopUpdateAction => ({ type: DESKTOP_UPDATE.ENABLE });

export const checking = (): DesktopUpdateAction => ({ type: DESKTOP_UPDATE.CHECKING });

export const available = (info: UpdateInfo): DesktopUpdateAction => ({
    type: DESKTOP_UPDATE.AVAILABLE,
    payload: info,
});

export const notAvailable = (info: UpdateInfo) => (dispatch: Dispatch) => {
    if (info.isManualCheck) {
        dispatch(addToast({ type: 'auto-updater-no-new' }));
    }

    dispatch({
        type: DESKTOP_UPDATE.NOT_AVAILABLE,
        payload: info,
    });
};

export const downloading = (progress: Partial<UpdateProgress>): DesktopUpdateAction => ({
    type: DESKTOP_UPDATE.DOWNLOADING,
    payload: progress,
});

export const ready = (info: UpdateInfo): DesktopUpdateAction => ({
    type: DESKTOP_UPDATE.READY,
    payload: info,
});

export const error = (err: Error) => (dispatch: Dispatch, getState: GetState) => {
    // TODO: Properly display error
    console.error('auto-updater', err);

    const { state } = getState().desktopUpdate;

    // Ignore displaying errors while checking
    if (state !== UpdateState.Checking) {
        dispatch(addToast({ type: 'auto-updater-error', state }));
    }

    dispatch({
        type: DESKTOP_UPDATE.NOT_AVAILABLE,
    });
};

export const setUpdateWindow = (win: UpdateWindow): DesktopUpdateAction => ({
    type: DESKTOP_UPDATE.WINDOW,
    payload: win,
});

export const newVersionFirstRun = (version: string) => (dispatch: Dispatch) => {
    dispatch(addToast({ type: 'auto-updater-new-version-first-run', version }));
};

export const openEarlyAccessSetup = (): DesktopUpdateAction => ({
    type: DESKTOP_UPDATE.OPEN_EARLY_ACCESS_SETUP,
});

export const allowPrerelease = (allowPrerelease: boolean): DesktopUpdateAction => ({
    type: DESKTOP_UPDATE.ALLOW_PRERELEASE,
    payload: allowPrerelease,
});

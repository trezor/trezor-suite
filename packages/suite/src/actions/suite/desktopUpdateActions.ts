import { DESKTOP_UPDATE } from '@suite-actions/constants';
import { addToast } from '@suite-actions/notificationActions';
import { Dispatch, GetState } from '@suite-types';
import { UpdateInfo, UpdateProgress, UpdateWindow } from '@suite-types/desktop';

export type DesktopUpdateAction =
    | { type: typeof DESKTOP_UPDATE.ENABLE }
    | { type: typeof DESKTOP_UPDATE.CHECKING }
    | { type: typeof DESKTOP_UPDATE.AVAILABLE; payload: UpdateInfo }
    | { type: typeof DESKTOP_UPDATE.NOT_AVAILABLE; payload?: UpdateInfo }
    | { type: typeof DESKTOP_UPDATE.DOWNLOADING; payload: UpdateProgress }
    | { type: typeof DESKTOP_UPDATE.READY; payload: UpdateInfo }
    | { type: typeof DESKTOP_UPDATE.SKIP; payload: string }
    | { type: typeof DESKTOP_UPDATE.WINDOW; payload: UpdateWindow };

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

export const downloading = (progress: UpdateProgress): DesktopUpdateAction => ({
    type: DESKTOP_UPDATE.DOWNLOADING,
    payload: progress,
});

export const ready = (info: UpdateInfo): DesktopUpdateAction => ({
    type: DESKTOP_UPDATE.READY,
    payload: info,
});

export const skip = (version: string): DesktopUpdateAction => ({
    type: DESKTOP_UPDATE.SKIP,
    payload: version,
});

export const error = (err: Error) => (dispatch: Dispatch, getState: GetState) => {
    // TODO: Properly display error
    console.error('auto-updater', err);

    const { state } = getState().desktopUpdate;

    // Ignore displaying errors while checking
    if (state !== 'checking') {
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

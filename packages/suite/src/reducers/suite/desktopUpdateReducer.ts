import produce from 'immer';
import { UpdateInfo, UpdateProgress } from '@trezor/suite-desktop-api';
import { DESKTOP_UPDATE, SUITE } from 'src/actions/suite/constants';
import { Action } from 'src/types/suite';
import { DesktopAppUpdateState as UpdateState } from '@suite-common/suite-constants';

export { DesktopAppUpdateState as UpdateState } from '@suite-common/suite-constants';

export type UpdateWindow = 'maximized' | 'minimized' | 'hidden';

/**
 * state: UpdateState ↑
 * progress: Information about download progress (size, speed, ...)
 * latest: Information about latest version (if you're on the latest version, this will contain the current version)
 * window: State of the update window
 * - maximized: Displayed in a modal
 * - minimized: Displayed as a notification
 * - hidden: Hidden
 */
export interface State {
    enabled: boolean;
    state: UpdateState;
    progress?: UpdateProgress;
    latest?: UpdateInfo;
    window: UpdateWindow;
    allowPrerelease: boolean;
}

const initialState: State = {
    enabled: false,
    state: UpdateState.NotAvailable,
    window: 'maximized',
    allowPrerelease: false,
};

const desktopUpdateReducer = (state: State = initialState, action: Action): State =>
    produce(state, draft => {
        switch (action.type) {
            case SUITE.DESKTOP_HANDSHAKE:
                if (action.payload.desktopUpdate) {
                    draft.enabled = true;
                    draft.allowPrerelease = action.payload.desktopUpdate.allowPrerelease;
                }
                break;
            case DESKTOP_UPDATE.CHECKING:
                draft.state = UpdateState.Checking;
                break;
            case DESKTOP_UPDATE.AVAILABLE:
                draft.state = UpdateState.Available;
                draft.latest = action.payload;
                break;
            case DESKTOP_UPDATE.NOT_AVAILABLE:
                draft.state = UpdateState.NotAvailable;
                draft.latest = action.payload;
                break;
            case DESKTOP_UPDATE.DOWNLOAD:
                draft.state = UpdateState.Downloading;
                break;
            case DESKTOP_UPDATE.DOWNLOADING:
                draft.progress = action.payload;
                break;
            case DESKTOP_UPDATE.READY:
                draft.state = UpdateState.Ready;
                draft.latest = action.payload;
                break;
            case DESKTOP_UPDATE.WINDOW:
                draft.window = action.payload;
                break;
            case DESKTOP_UPDATE.OPEN_EARLY_ACCESS_ENABLE:
                draft.state = UpdateState.EarlyAccessEnable;
                draft.window = 'maximized';
                break;
            case DESKTOP_UPDATE.OPEN_EARLY_ACCESS_DISABLE:
                draft.state = UpdateState.EarlyAccessDisable;
                draft.window = 'maximized';
                break;
            case DESKTOP_UPDATE.ALLOW_PRERELEASE:
                draft.allowPrerelease = action.payload;
                break;
            // no default
        }
    });

export default desktopUpdateReducer;

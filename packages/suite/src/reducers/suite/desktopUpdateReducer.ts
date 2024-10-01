import produce from 'immer';
import { UpdateInfo, UpdateProgress } from '@trezor/suite-desktop-api';
import { DESKTOP_UPDATE, SUITE } from 'src/actions/suite/constants';
import { Action } from 'src/types/suite';
import { DesktopAppUpdateState as UpdateState } from '@suite-common/suite-constants';

export { DesktopAppUpdateState as UpdateState } from '@suite-common/suite-constants';

export type UpdateModalVisibility = 'maximized' | 'minimized' | 'hidden';

/**
 * state: UpdateState ↑
 * progress: Information about download progress (size, speed, ...)
 * latest: Information about latest version (if you're on the latest version, this will contain the current version)
 * window: State of the update window
 * - maximized: Displayed in a modal
 * - minimized: Displayed as a notification
 * - hidden: Hidden
 */
export interface DesktopUpdateState {
    enabled: boolean;
    state: UpdateState;
    progress?: UpdateProgress;
    latest?: UpdateInfo;
    modalVisibility: UpdateModalVisibility;
    allowPrerelease: boolean;
    isAutomaticUpdateEnabled: boolean;
    firstRunAfterUpdate: boolean;

    /**
     * This flag suppresses the "just updated" notification state
     * when user already interacted with it.
     */
    justUpdatedInteractedWith: boolean;
}

const initialState: DesktopUpdateState = {
    enabled: false,
    state: UpdateState.NotAvailable,
    modalVisibility: 'hidden',
    allowPrerelease: false,
    isAutomaticUpdateEnabled: false,
    firstRunAfterUpdate: false,
    justUpdatedInteractedWith: false,
};

const desktopUpdateReducer = (
    state: DesktopUpdateState = initialState,
    action: Action,
): DesktopUpdateState =>
    produce(state, draft => {
        switch (action.type) {
            case SUITE.DESKTOP_HANDSHAKE:
                if (action.payload.desktopUpdate) {
                    draft.enabled = true;
                    draft.allowPrerelease = action.payload.desktopUpdate.allowPrerelease;
                    draft.isAutomaticUpdateEnabled =
                        action.payload.desktopUpdate.isAutomaticUpdateEnabled;
                    draft.firstRunAfterUpdate = action.payload.desktopUpdate.firstRun !== undefined;
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
            case DESKTOP_UPDATE.OPEN_JUST_UPDATED_CHANGELOG:
                draft.state = UpdateState.JustUpdated;
                draft.modalVisibility = 'maximized';
                draft.justUpdatedInteractedWith = true;
                break;
            case DESKTOP_UPDATE.MODAL_VISIBILITY:
                draft.modalVisibility = action.payload;
                break;
            case DESKTOP_UPDATE.OPEN_EARLY_ACCESS_ENABLE:
                draft.state = UpdateState.EarlyAccessEnable;
                draft.modalVisibility = 'maximized';
                break;
            case DESKTOP_UPDATE.OPEN_EARLY_ACCESS_DISABLE:
                draft.state = UpdateState.EarlyAccessDisable;
                draft.modalVisibility = 'maximized';
                break;
            case DESKTOP_UPDATE.ALLOW_PRERELEASE:
                draft.allowPrerelease = action.payload;
                break;
            case DESKTOP_UPDATE.SET_AUTOMATIC_UPDATES:
                draft.isAutomaticUpdateEnabled = action.payload.isEnabled;
                break;
            // no default
        }
    });

export default desktopUpdateReducer;

import { produce } from 'immer';

import { DesktopAppUpdateState as UpdateState } from '@suite-common/suite-constants';
import { type UpdateInfo, type UpdateProgress } from '@trezor/suite-desktop-api';

import { DESKTOP_UPDATE, SUITE } from 'src/actions/suite/constants';
import { type Action } from 'src/types/suite';

export { DesktopAppUpdateState as UpdateState } from '@suite-common/suite-constants';

export interface DesktopUpdateState {
    enabled: boolean;
    state: UpdateState;
    // Information about download progress (size, speed, ...)
    progress?: UpdateProgress;
    // Information about latest version (if you're on the latest version, this will contain the current version)
    latest?: UpdateInfo;
    // Displays the global desktop update modal (renders different content as per `state`)
    isModalVisible: boolean;
    allowPrerelease: boolean;
    isAutomaticUpdateEnabled: boolean;
    firstRunAfterUpdate: boolean;
    // Displays an informational modal to view current version
    isVersionInfoModalVisible: boolean;

    /**
     * This flag suppresses the "just updated" notification state
     * when user already interacted with it.
     */
    justUpdatedInteractedWith: boolean;
}

export type DesktopUpdateRootState = {
    desktopUpdate: DesktopUpdateState;
};

const initialState: DesktopUpdateState = {
    enabled: false,
    state: UpdateState.NotAvailable,
    isModalVisible: false,
    allowPrerelease: false,
    isAutomaticUpdateEnabled: false,
    firstRunAfterUpdate: false,
    isVersionInfoModalVisible: false,
    justUpdatedInteractedWith: false,
};

export const desktopUpdateInitialState = initialState;

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
            case DESKTOP_UPDATE.JUST_UPDATED:
                draft.state = UpdateState.JustUpdated;
                draft.isModalVisible = true;
                draft.justUpdatedInteractedWith = true;
                break;
            case DESKTOP_UPDATE.MODAL_VISIBILITY:
                draft.isModalVisible = action.payload;
                break;
            case DESKTOP_UPDATE.VERSION_INFO_MODAL_VISIBILITY:
                draft.isVersionInfoModalVisible = action.payload;
                break;
            case DESKTOP_UPDATE.OPEN_EARLY_ACCESS_ENABLE:
                draft.state = UpdateState.EarlyAccessEnable;
                draft.isModalVisible = true;
                break;
            case DESKTOP_UPDATE.OPEN_EARLY_ACCESS_DISABLE:
                draft.state = UpdateState.EarlyAccessDisable;
                draft.isModalVisible = true;
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

export const selectDesktopUpdate = (state: DesktopUpdateRootState) => state.desktopUpdate;

export const selectDesktopUpdateEnabled = (state: DesktopUpdateRootState) =>
    state.desktopUpdate.enabled;

export const selectDesktopUpdateAllowPrerelease = (state: DesktopUpdateRootState) =>
    state.desktopUpdate.allowPrerelease;

export default desktopUpdateReducer;

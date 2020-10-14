import produce from 'immer';
import { DESKTOP_UPDATE } from '@suite-actions/constants';
import { Action } from '@suite-types';
import { UpdateInfo, UpdateProgress, UpdateWindow } from '@suite-types/desktop';

/**
 * state: Current updater state
 * - checking: Checking Github for newer releases
 * - available: Newer version is available
 * - not-available: Currently on the latest version
 * - downloading: Currently downloading the latest version
 * - ready: Latest version is downloaded and going to be installed on the next restart
 * skip: String with the skipped version
 * progress: Information about download progress (size, speed, ...)
 * latest: Information about latest version (if you're on the latest version, this will contain the current version)
 * window: State of the update window
 * - maximized: Displayed in a modal
 * - minimized: Displayed as a notification
 * - hidden: Hidden
 */
export interface State {
    state: 'checking' | 'available' | 'not-available' | 'downloading' | 'ready';
    skip?: string;
    progress?: UpdateProgress;
    latest?: UpdateInfo;
    window: UpdateWindow;
}

const initialState: State = {
    state: 'not-available',
    window: 'maximized',
};

const desktopUpdateReducer = (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case DESKTOP_UPDATE.CHECKING:
                draft.state = 'checking';
                break;
            case DESKTOP_UPDATE.AVAILABLE:
                draft.state = 'available';
                draft.latest = action.payload;
                break;
            case DESKTOP_UPDATE.NOT_AVAILABLE:
                draft.state = 'not-available';
                draft.latest = action.payload;
                break;
            case DESKTOP_UPDATE.DOWNLOADING:
                draft.state = 'downloading';
                draft.progress = action.payload;
                break;
            case DESKTOP_UPDATE.READY:
                draft.state = 'ready';
                draft.latest = action.payload;
                break;
            case DESKTOP_UPDATE.SKIP:
                draft.skip = action.payload;
                break;
            case DESKTOP_UPDATE.WINDOW:
                draft.window = action.payload;
                break;
            // no default
        }
    });
};

export default desktopUpdateReducer;

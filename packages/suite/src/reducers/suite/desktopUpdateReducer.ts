import produce from 'immer';
import { DESKTOP_UPDATE } from '@suite-actions/constants';
import { Action } from '@suite-types';
import { UpdateInfo, UpdateProgress, UpdateWindow } from '@suite-types/desktop';

export interface State {
    state?: 'checking' | 'available' | 'not-available' | 'downloading' | 'ready';
    skip?: string;
    progress?: UpdateProgress;
    latest?: UpdateInfo;
    window: UpdateWindow;
}

const initialState: State = {
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
                draft.skip = state?.latest?.version || '';
                break;
            case DESKTOP_UPDATE.WINDOW:
                draft.window = action.payload;
                break;
            // no default
        }
    });
};

export default desktopUpdateReducer;

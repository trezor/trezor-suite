import produce from 'immer';
import { RESIZE } from '@suite-actions/constants';
import { Action } from '@suite-types';

export interface State {
    size: 'small' | 'normal' | 'large';
    screenWidth: number | null;
    screenHeight: number | null;
}

export const initialState: State = {
    size: 'normal',
    screenWidth: null,
    screenHeight: null,
};

export default (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case RESIZE.UPDATE_WINDOW_SIZE:
                draft.size = action.screenWidth && action.screenWidth < 600 ? 'small' : 'normal';
                draft.screenWidth = action.screenWidth;
                draft.screenHeight = action.screenHeight;
                break;
            // no default
        }
    });
};

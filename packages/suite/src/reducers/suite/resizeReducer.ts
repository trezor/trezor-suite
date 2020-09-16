import produce from 'immer';
import { variables } from '@trezor/components';
import { RESIZE } from '@suite-actions/constants';
import { getNumberFromPxString } from '@suite-utils/string';
import { Action } from '@suite-types';

const sizes = {
    UNAVAILABLE: getNumberFromPxString(variables.SCREEN_SIZE.UNAVAILABLE),
    SMALL: getNumberFromPxString(variables.SCREEN_SIZE.SM),
    MEDIUM: getNumberFromPxString(variables.SCREEN_SIZE.MD),
    LARGE: getNumberFromPxString(variables.SCREEN_SIZE.LG),
    XLARGE: getNumberFromPxString(variables.SCREEN_SIZE.XL),
};

const getSize = (screenWidth: number | null): State['size'] => {
    if (!screenWidth) {
        return 'NORMAL';
    }

    if (screenWidth < sizes.UNAVAILABLE) {
        return 'UNAVAILABLE';
    }

    if (screenWidth <= sizes.SMALL) {
        return 'TINY';
    }

    if (screenWidth <= sizes.MEDIUM) {
        return 'SMALL';
    }

    if (screenWidth <= sizes.LARGE) {
        return 'NORMAL';
    }

    if (screenWidth <= sizes.XLARGE) {
        return 'LARGE';
    }

    if (screenWidth > sizes.XLARGE) {
        return 'XLARGE';
    }

    return 'NORMAL';
};

export interface State {
    size: 'UNAVAILABLE' | 'TINY' | 'SMALL' | 'NORMAL' | 'LARGE' | 'XLARGE';
    screenWidth: number | null;
    screenHeight: number | null;
}

export const initialState: State = {
    size: 'NORMAL',
    screenWidth: null,
    screenHeight: null,
};

const resizeReducer = (state: State = initialState, action: Action): State => {
    return produce(state, draft => {
        switch (action.type) {
            case RESIZE.UPDATE_WINDOW_SIZE:
                draft.size = getSize(action.screenWidth);
                draft.screenWidth = action.screenWidth;
                draft.screenHeight = action.screenHeight;
                break;
            // no default
        }
    });
};

export default resizeReducer;

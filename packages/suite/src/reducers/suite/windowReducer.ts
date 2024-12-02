import produce from 'immer';

import * as variables from '@trezor/components/src/config/variables'; // can't import from index cause it would import all UI components
import { getNumberFromPixelString } from '@trezor/utils';

import { WINDOW } from 'src/actions/suite/constants';
import { Action } from 'src/types/suite';

const sizes = {
    UNAVAILABLE: getNumberFromPixelString(variables.SCREEN_SIZE.UNAVAILABLE),
    SMALL: getNumberFromPixelString(variables.SCREEN_SIZE.SM),
    MEDIUM: getNumberFromPixelString(variables.SCREEN_SIZE.MD),
    LARGE: getNumberFromPixelString(variables.SCREEN_SIZE.LG),
    XLARGE: getNumberFromPixelString(variables.SCREEN_SIZE.XL),
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

interface WindowRootState {
    window: State;
}

export const initialState: State = {
    size: 'NORMAL',
    screenWidth: null,
    screenHeight: null,
};

const windowReducer = (state: State = initialState, action: Action): State =>
    produce(state, draft => {
        switch (action.type) {
            case WINDOW.UPDATE_WINDOW_SIZE:
                draft.size = getSize(action.screenWidth);
                draft.screenWidth = action.screenWidth;
                draft.screenHeight = action.screenHeight;
                break;
            // no default
        }
    });

export default windowReducer;

export const selectWindowSize = (state: WindowRootState) => state.window.size;

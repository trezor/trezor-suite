import { RESIZE } from './constants';
import { Dispatch } from '@suite-types';

export interface ResizeActions {
    type: typeof RESIZE.UPDATE_WINDOW_SIZE;
    screenWidth: number | null;
    screenHeight: number | null;
}

export const updateWindowSize = (screenWidth: number | null, screenHeight: number | null) => (
    dispatch: Dispatch,
) => {
    dispatch({
        type: RESIZE.UPDATE_WINDOW_SIZE,
        screenWidth,
        screenHeight,
    });
};

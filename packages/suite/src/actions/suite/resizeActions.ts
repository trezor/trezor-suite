import { RESIZE } from './constants';

export interface ResizeAction {
    type: typeof RESIZE.UPDATE_WINDOW_SIZE;
    screenWidth: number | null;
    screenHeight: number | null;
}

export const updateWindowSize = (screenWidth: number, screenHeight: number): ResizeAction => ({
    type: RESIZE.UPDATE_WINDOW_SIZE,
    screenWidth,
    screenHeight,
});

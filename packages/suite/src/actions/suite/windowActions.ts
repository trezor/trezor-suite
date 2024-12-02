import { WINDOW } from './constants';

export interface WindowResizeAction {
    type: typeof WINDOW.UPDATE_WINDOW_SIZE;
    screenWidth: number | null;
    screenHeight: number | null;
}

export const updateWindowSize = (
    screenWidth: number,
    screenHeight: number,
): WindowResizeAction => ({
    type: WINDOW.UPDATE_WINDOW_SIZE,
    screenWidth,
    screenHeight,
});

import { createAction } from '@reduxjs/toolkit';

import { WINDOW } from './constants';

export const updateWindowSize = createAction(
    WINDOW.UPDATE_WINDOW_SIZE,
    (screenWidth: number, screenHeight: number) => ({
        payload: {
            screenWidth,
            screenHeight,
        },
    }),
);

export const updateWindowVisibility = createAction(
    WINDOW.UPDATE_WINDOW_VISIBILITY,
    (isVisible: boolean) => ({
        payload: { isVisible },
    }),
);

export type WindowAction =
    | ReturnType<typeof updateWindowSize>
    | ReturnType<typeof updateWindowVisibility>;

import { createAction } from '@reduxjs/toolkit';

import { BreakpointFlags } from '@trezor/theme';

import { WINDOW } from './constants';

export const updateWindowVisibility = createAction(
    WINDOW.UPDATE_WINDOW_VISIBILITY,
    (isVisible: boolean) => ({
        payload: { isVisible },
    }),
);

export const updateBreakpoints = createAction(
    WINDOW.UPDATE_BREAKPOINTS,
    (breakpointFlags: Partial<BreakpointFlags>) => ({
        payload: breakpointFlags,
    }),
);

export type WindowAction =
    | ReturnType<typeof updateWindowVisibility>
    | ReturnType<typeof updateBreakpoints>;

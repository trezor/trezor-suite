import { createAction } from '@reduxjs/toolkit';

import { type BreakpointFlags } from '@trezor/theme';

import * as WINDOW from './constants/windowConstants';

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

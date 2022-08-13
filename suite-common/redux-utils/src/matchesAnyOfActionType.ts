import { Action } from '@reduxjs/toolkit';

import { ActionType } from './types';

export const matchesAnyOfActionType =
    (...matchers: Array<ActionType>) =>
    (action: Action<string>) =>
        matchers.some(matcher => matcher === action.type);

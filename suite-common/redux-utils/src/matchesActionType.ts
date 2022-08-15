import { Action } from '@reduxjs/toolkit';

import { ActionType } from './types';

export const matchesActionType =
    (actionType: ActionType) =>
    ({ type }: Action<string>) =>
        actionType === type;

import { createAction } from '@reduxjs/toolkit';

export const mockLockDevice = () =>
    createAction(
        'mock/lockDevice',
        (payload: boolean, source?: { id?: string; origin?: string }) => ({
            payload,
            meta: { ...source, at: Date.now() },
        }),
    );

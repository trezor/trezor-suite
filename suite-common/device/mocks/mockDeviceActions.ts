import { createAction } from '@reduxjs/toolkit';

export const mockLockDevice = () =>
    createAction('mock/lockDevice', (payload: boolean) => ({ payload }));

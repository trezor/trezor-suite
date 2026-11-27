import { createAction } from '@reduxjs/toolkit';

export const onSuiteInit = createAction('@suite/init');
export const onSuiteReady = createAction('@suite/ready');
export const setSuiteError = createAction<string>('@suite/error');

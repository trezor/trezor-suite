import { useDispatch as useReduxDispatch } from 'react-redux';

import { type AsyncThunkAction } from '@reduxjs/toolkit';
import { type ThunkDispatch } from 'redux-thunk';

import { type ExtraDependencies } from '@suite-common/redux-utils';

import { type SuiteExtra } from 'src/support/extraDependencies';
import { type Action, type AppState, type Dispatch, type GetState } from 'src/types/suite';

type SuiteDispatch = {
    <T extends AsyncThunkAction<any, any, any>>(asyncThunkAction: T): ReturnType<T>;
    <T>(thunkAction: (dispatch: Dispatch, getState: GetState, extra: SuiteExtra) => T): T;
    <T>(thunkAction: (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => T): T;
} & Dispatch &
    ThunkDispatch<AppState, SuiteExtra, Action>;

export const useDispatch: () => SuiteDispatch = useReduxDispatch;

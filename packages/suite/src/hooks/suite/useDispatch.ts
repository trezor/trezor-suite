import { useDispatch as useReduxDispatch } from 'react-redux';

import { type UnknownAction } from '@reduxjs/toolkit';

import { type ExtraDependencies } from '@suite-common/redux-extra-dependencies';

import { type SuiteExtra } from 'src/support/extraDependencies';
import { type Dispatch, type GetState } from 'src/types/suite';

type SuiteDispatch = {
    <TReturn>(
        thunkAction: (dispatch: Dispatch, getState: GetState, extra: SuiteExtra) => TReturn,
    ): TReturn;
    <TReturn>(
        thunkAction: (dispatch: Dispatch, getState: GetState, extra: ExtraDependencies) => TReturn,
    ): TReturn;
    <TAction extends UnknownAction>(action: TAction): TAction;
    <TReturn, TAction extends UnknownAction>(
        action: TAction | ((dispatch: Dispatch, getState: GetState, extra: SuiteExtra) => TReturn),
    ): TAction | TReturn;
};

export const useDispatch: () => SuiteDispatch = useReduxDispatch;

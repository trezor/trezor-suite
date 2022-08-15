/* eslint-disable @typescript-eslint/ban-types */
import { AnyAction, AsyncThunk, ThunkAction } from '@reduxjs/toolkit';

// This SuiteCompatible types should be used only in places where you need support
// for both redux-toolkit and legacy redux stuff like it is in externalDependencies.
// Primary you should use types like ActionCreatorWithPayload from redux-toolkit!
export type SuiteCompatibleThunk<TPayload, TReturn = void> =
    | AsyncThunk<TReturn, TPayload, {}>
    | ((payload: TPayload) => ThunkAction<TReturn, any, any, AnyAction>);
export type SuiteCompatibleSelector<TReturn> = (state: any) => TReturn;

export type ActionType = string;

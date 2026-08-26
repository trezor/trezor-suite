import { AsyncThunkAction, ThunkAction } from '@reduxjs/toolkit';
import type { Action, UnknownAction } from 'redux';

declare module 'redux' {
    export interface Dispatch<A extends Action = UnknownAction> {
        <T extends A>(action: T, ...extraArgs: any[]): T;

        <TThunk extends AsyncThunkAction<any, any, any>>(thunk: TThunk): ReturnType<TThunk>;

        <ReturnType = any, State = any, ExtraThunkArg = any>(
            thunkAction: ThunkAction<ReturnType, State, ExtraThunkArg, A>,
        ): ReturnType;
    }
}

import type { AsyncThunkAction, UnknownAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

declare module 'redux' {
    export interface Dispatch<A extends Action = UnknownAction> {
        <TThunk extends AsyncThunkAction<any, any, any>>(thunk: TThunk): ReturnType<TThunk>;

        <ReturnType = any, State = any, ExtraThunkArg = any>(
            thunkAction: ThunkAction<ReturnType, State, ExtraThunkArg, A>,
        ): ReturnType;

        <T extends A>(action: T, ...extraArgs: any[]): T;
    }

    export interface Action<T = any> {
        type: T;
    }

    export interface MiddlewareAPI<D extends Dispatch = Dispatch<UnknownAction>, S = any> {
        dispatch: D;
        getState(): S;
    }

    export interface Middleware<
        _DispatchExt = Record<never, never>,
        S = any,
        D extends Dispatch = Dispatch<UnknownAction>,
    > {
        (api: MiddlewareAPI<D, S>): (next: Dispatch<UnknownAction>) => (action: any) => any;
    }
}

export {};

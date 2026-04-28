import type { AsyncThunkAction } from '@reduxjs/toolkit';
import type { ThunkAction } from 'redux-thunk';

import { AnyAction } from '@suite-common/redux-utils';

declare module 'redux' {
    export interface Dispatch<A extends Action = AnyAction> {
        <TThunk extends AsyncThunkAction<any, any, any>>(thunk: TThunk): ReturnType<TThunk>;

        <ReturnType = any, State = any, ExtraThunkArg = any>(
            thunkAction: ThunkAction<ReturnType, State, ExtraThunkArg, A>,
        ): ReturnType;

        <T extends A>(action: T, ...extraArgs: any[]): T;
    }

    export interface Action<T = any> {
        type: T;
    }

    export interface MiddlewareAPI<D extends Dispatch = Dispatch<AnyAction>, S = any> {
        dispatch: D;
        getState(): S;
    }

    export interface Middleware<
        _DispatchExt = Record<never, never>,
        S = any,
        D extends Dispatch = Dispatch<AnyAction>,
    > {
        (api: MiddlewareAPI<D, S>): (next: Dispatch<AnyAction>) => (action: any) => any;
    }
}

export {};

import { type AsyncThunkAction } from '@reduxjs/toolkit';
import { compose } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import { AnyAction } from '@suite-common/redux-utils';

declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
        electronFind: {
            onShow: (callback: () => void) => void;
            offShow: (callback: () => void) => void;
        };
    }
}

declare module 'redux' {
    /*
     * Overload to add thunk support to Redux's dispatch() function and also to override UnknownAction with AnyAction
     */
    export interface Dispatch<A extends Action = AnyAction> {
        <TThunk extends AsyncThunkAction<any, any, any>>(thunk: TThunk): ReturnType<TThunk>;

        <ReturnType = any, State = any, ExtraThunkArg = any>(
            thunkAction: ThunkAction<ReturnType, State, ExtraThunkArg, A>,
        ): ReturnType;
    }

    // Action types from older version of redux that are less strict otherwise we have like million error due to UnknownAction
    export interface Action<T = any> {
        type: T;
    }

    // Older types for MiddlewareApi and Middleware that are using AnyAction instead of UnknownAction

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

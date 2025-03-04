import { compose } from 'redux';
import type { ThunkAction } from 'redux-thunk';

import { AnyAction } from '@suite-common/redux-utils';

declare global {
    interface Window {
        __REDUX_DEVTOOLS_EXTENSION_COMPOSE__?: typeof compose;
    }
}

declare module 'redux' {
    /**
     * This is copied from older version of the redux-thunk package
     * https://github.com/reduxjs/redux-thunk/blob/698241dec398639018d5f21c529b0889b78d36f8/extend-redux.d.ts
     * Because suite still use that odl bindActionCreators function we need to keep it, once we get rid of that we can remove this
     */
    function bindActionCreators<ActionCreators extends ActionCreatorsMapObject<any>>(
        actionCreators: ActionCreators,
        dispatch: Dispatch,
    ): {
        [ActionCreatorName in keyof ActionCreators]: ReturnType<
            ActionCreators[ActionCreatorName]
        > extends ThunkAction<any, any, any, any>
            ? (
                  ...args: Parameters<ActionCreators[ActionCreatorName]>
              ) => ReturnType<ReturnType<ActionCreators[ActionCreatorName]>>
            : ActionCreators[ActionCreatorName];
    };

    /*
     * Overload to add thunk support to Redux's dispatch() function and also to override UnknownAction with AnyAction
     */
    export interface Dispatch<A extends Action = AnyAction> {
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
        _DispatchExt = {},
        S = any,
        D extends Dispatch = Dispatch<AnyAction>,
    > {
        (api: MiddlewareAPI<D, S>): (next: Dispatch<AnyAction>) => (action: any) => any;
    }
}

export {};

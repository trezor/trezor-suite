import {
    type Action,
    type ActionCreatorWithPreparedPayload,
    type ActionReducerMapBuilder,
    type Draft,
    type EnhancedStore,
    createReducer,
} from '@reduxjs/toolkit';
import type { ThunkDispatch } from 'redux-thunk';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type NotFunction<T> = T extends Function ? never : T;

/**
 * A reducer handed to a slice from the outside, for a state slice the injecting side does not know.
 * `TState` is worth naming where it is known: without it nothing stops one slice being wired with
 * another slice's reducer.
 */
type InjectedReducer<TState, TAction extends Action> = (
    state: Draft<TState>,
    action: TAction,
) => void;

type InjectedAction = { type: any; payload: any };

export type ActionTypesDep<TName extends string> = {
    actionTypes: Record<TName, string>;
};

export type ReducersDep<
    TName extends string,
    TState = any,
    TAction extends Action = InjectedAction,
> = {
    reducers: Record<TName, InjectedReducer<TState, TAction>>;
};

export type ActionsDep<
    TActions extends Record<string, ActionCreatorWithPreparedPayload<any, any>>,
> = {
    actions: TActions;
};

/**
 * `void` means "this reducer needs nothing injected". The empty record keeps the callback from
 * reading anything off `extra`, while still letting a composition root pass its whole dependency
 * object to `prepareReducer` — which is what every call site does today.
 */
type ReducerExtra<TExtra> = [TExtra] extends [void] ? Record<never, never> : TExtra;

type EnhancedStoreState<TStore extends EnhancedStore<any, any>> = ReturnType<TStore['getState']>;
type EnhancedStoreAction<TStore extends EnhancedStore<any, any>> =
    TStore extends EnhancedStore<any, infer TAction> ? TAction : never;

export const createReducerWithExtraDeps =
    <S extends NotFunction<any>, TExtra = void>(
        initialState: S | (() => S),
        builderCallback: (builder: ActionReducerMapBuilder<S>, extra: ReducerExtra<TExtra>) => void,
    ) =>
    // The whole dependency object is handed over as-is: what the callback may read off it is decided
    // by `TExtra`, not by picking keys here.
    (extraDeps: ReducerExtra<TExtra>) =>
        createReducer(initialState, builder => builderCallback(builder, extraDeps));

// Adds the thunk dispatch type that configureStore cannot infer through the extra middleware factory.
export const castExtraStore = <TExtra, TStore extends EnhancedStore<any, any>>(
    store: TStore,
    extra: TExtra | null,
): {
    store: TStore & {
        dispatch: ThunkDispatch<EnhancedStoreState<TStore>, TExtra, EnhancedStoreAction<TStore>>;
    };
    extra: NonNullable<TExtra>;
} => {
    if (!extra) {
        throw new Error('castExtraStore: Extra dependencies not initialized');
    }

    return {
        store,
        extra,
    };
};

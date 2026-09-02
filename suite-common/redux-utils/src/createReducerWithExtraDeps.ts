import { type ActionReducerMapBuilder, type EnhancedStore, createReducer } from '@reduxjs/toolkit';
import type { ThunkDispatch } from 'redux-thunk';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type NotFunction<T> = T extends Function ? never : T;

type InjectedReducer = (state: any, action: { type: any; payload: any }) => void;

export type ActionTypesDep<TName extends string> = {
    actionTypes: Record<TName, string>;
};

export type ReducersDep<TName extends string> = {
    reducers: Record<TName, InjectedReducer>;
};

type ReducerExtra<TExtra> = [TExtra] extends [void] ? Record<never, never> : TExtra;
type PrepareReducerExtra<TExtra> = [TExtra] extends [void] ? unknown : TExtra;

type EnhancedStoreState<TStore extends EnhancedStore<any, any>> = ReturnType<TStore['getState']>;
type EnhancedStoreAction<TStore extends EnhancedStore<any, any>> =
    TStore extends EnhancedStore<any, infer TAction> ? TAction : never;

export const createReducerWithExtraDeps =
    <S extends NotFunction<any>, TExtra = void>(
        initialState: S | (() => S),
        builderCallback: (builder: ActionReducerMapBuilder<S>, extra: ReducerExtra<TExtra>) => void,
    ) =>
    (extraDeps: PrepareReducerExtra<TExtra>) =>
        createReducer(initialState, builder =>
            builderCallback(builder, extraDeps as ReducerExtra<TExtra>),
        );

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

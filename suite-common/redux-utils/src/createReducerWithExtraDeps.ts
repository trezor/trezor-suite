import { type ActionReducerMapBuilder, type EnhancedStore, createReducer } from '@reduxjs/toolkit';
import type { ThunkDispatch } from 'redux-thunk';

import { type ExtraDependenciesForReducer } from './extraDependenciesType';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type NotFunction<T> = T extends Function ? never : T;

type EnhancedStoreState<TStore extends EnhancedStore<any, any>> = ReturnType<TStore['getState']>;
type EnhancedStoreAction<TStore extends EnhancedStore<any, any>> =
    TStore extends EnhancedStore<any, infer TAction> ? TAction : never;

export const createReducerWithExtraDeps =
    <S extends NotFunction<any>>(
        initialState: S | (() => S),
        builderCallback: (
            builder: ActionReducerMapBuilder<S>,
            extra: ExtraDependenciesForReducer,
        ) => void,
    ) =>
    (extraDeps: ExtraDependenciesForReducer) =>
        createReducer(initialState, builder =>
            builderCallback(builder, {
                actionTypes: extraDeps.actionTypes,
                actions: extraDeps.actions,
                reducers: extraDeps.reducers,
            }),
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

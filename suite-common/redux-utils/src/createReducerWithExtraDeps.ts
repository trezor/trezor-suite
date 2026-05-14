import { type ActionReducerMapBuilder, type EnhancedStore, createReducer } from '@reduxjs/toolkit';
import type { ThunkDispatch } from 'redux-thunk';

import { type ExtraDependenciesForReducer } from './extraDependenciesType';

// eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
type NotFunction<T> = T extends Function ? never : T;

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

// NOTE: adds the proper thunk dispatch type to the store
export const castExtraStore = <E, S extends EnhancedStore<any, any>>(
    store: S,
    extra: E | null,
): {
    store: S & {
        dispatch: ThunkDispatch<S, E, any>;
    };
    extra: NonNullable<E>;
} => {
    if (!extra) {
        throw new Error('castExtraStore: Extra dependencies not initialized');
    }

    return {
        store,
        extra,
    } as {
        store: S & {
            dispatch: ThunkDispatch<S, E, any>;
        };
        extra: NonNullable<E>;
    };
};

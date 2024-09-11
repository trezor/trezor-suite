import { ActionReducerMapBuilder, createReducer } from '@reduxjs/toolkit';

import { ExtraDependenciesForReducer } from './extraDependenciesType';

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

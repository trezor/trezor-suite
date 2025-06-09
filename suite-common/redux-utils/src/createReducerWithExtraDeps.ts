import { ActionReducerMapBuilder, createReducer } from '@reduxjs/toolkit';

import { ExtraDependenciesForReducer } from './extraDependenciesType';
import { DeepSerializable } from './types';

export const createReducerWithExtraDeps =
    <S>(
        initialState: DeepSerializable<S> | (() => DeepSerializable<S>),
        builderCallback: (
            builder: ActionReducerMapBuilder<DeepSerializable<S>>,
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



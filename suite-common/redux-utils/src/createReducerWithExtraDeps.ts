/* eslint-disable @typescript-eslint/ban-types */
import { ActionReducerMapBuilder, createReducer } from '@reduxjs/toolkit';

import { ExtraDependencies } from './extraDependenciesType';

type NotFunction<T> = T extends Function ? never : T;

type ExtraDependenciesForReducer = Pick<ExtraDependencies, 'actionTypes' | 'actions' | 'reducers'>;

export const createReducerWithExtraDeps =
    <S extends NotFunction<any>>(
        initialState: S | (() => S),
        builderCallback: (
            builder: ActionReducerMapBuilder<S>,
            extra: ExtraDependenciesForReducer,
        ) => void,
    ) =>
    (extraDeps: ExtraDependencies) =>
        createReducer(initialState, builder =>
            builderCallback(builder, {
                actionTypes: extraDeps.actionTypes,
                actions: extraDeps.actions,
                reducers: extraDeps.reducers,
            }),
        );

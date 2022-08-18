import {
    ActionReducerMapBuilder,
    createAction,
    createSlice,
    CreateSliceOptions,
    SliceCaseReducers,
} from '@reduxjs/toolkit';

import { ExtraDependencies } from './extraDependenciesType';
/*
This is nearly same function as createSlice from redux-toolkit, but instead of generating reducer it will generate
prepareReducer function that will be used to generate reducer. This functions accepts one argument - extra dependencies.
*/
export const createSliceWithExtraDeps = <
    State,
    CaseReducers extends SliceCaseReducers<State>,
    Name extends string = string,
>(
    options: Omit<CreateSliceOptions<State, CaseReducers, Name>, 'extraReducers'> & {
        extraReducers: (
            builder: ActionReducerMapBuilder<State>,
            extra: Pick<ExtraDependencies, 'actionTypes' | 'actions' | 'reducers'>,
        ) => void;
    },
) => {
    const emptyActionTypesProxy: any = new Proxy(
        {},
        {
            get: (_target, prop) =>
                `${options.name}/${
                    prop as string
                }/notImplemented/youShouldNeverSeeThisActionDispatched`,
        },
    );

    const emptyActionsProxy: any = new Proxy(
        {},
        {
            get: (_target, prop) =>
                createAction(
                    `${options.name}/${
                        prop as string
                    }/notImplemented/youShouldNeverSeeThisActionDispatched`,
                ),
        },
    );
    const emptyReducersProxy: any = new Proxy({}, { get: () => () => {} });

    // because we don't have extra injected, we need to "mock" them in order to generate everything else except reducer
    const { actions, name, getInitialState } = createSlice({
        ...options,
        extraReducers: builder => {
            options.extraReducers(builder, {
                actionTypes: emptyActionTypesProxy,
                actions: emptyActionsProxy,
                reducers: emptyReducersProxy,
            });
        },
    });

    const prepareReducer = (extraDeps: ExtraDependencies) =>
        createSlice({
            ...options,
            extraReducers: builder => {
                options.extraReducers(builder, {
                    actionTypes: extraDeps.actionTypes,
                    actions: extraDeps.actions,
                    reducers: extraDeps.reducers,
                });
            },
        }).reducer;

    return { actions, name, getInitialState, prepareReducer };
};

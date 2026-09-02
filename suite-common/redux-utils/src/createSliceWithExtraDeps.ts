import {
    type ActionReducerMapBuilder,
    type CreateSliceOptions,
    type SliceCaseReducers,
    createAction,
    createSlice,
} from '@reduxjs/toolkit';

/*
This is nearly same function as createSlice from redux-toolkit, but instead of generating reducer it will generate
prepareReducer function that will be used to generate reducer. This functions accepts one argument - extra dependencies.
*/
type SliceExtra<TExtra> = [TExtra] extends [void] ? Record<never, never> : TExtra;
type PrepareSliceExtra<TExtra> = [TExtra] extends [void] ? unknown : TExtra;

export const createSliceWithExtraDeps = <
    State,
    CaseReducers extends SliceCaseReducers<State>,
    Name extends string = string,
    TExtra = void,
>(
    options: Omit<CreateSliceOptions<State, CaseReducers, Name>, 'extraReducers'> & {
        extraReducers: (builder: ActionReducerMapBuilder<State>, extra: SliceExtra<TExtra>) => void;
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
            const emptyExtra = {
                actionTypes: emptyActionTypesProxy,
                actions: emptyActionsProxy,
                reducers: emptyReducersProxy,
            } as SliceExtra<TExtra>;

            options.extraReducers(builder, emptyExtra);
        },
    });

    const prepareReducer = (extraDeps: PrepareSliceExtra<TExtra>) =>
        createSlice({
            ...options,
            extraReducers: builder => {
                options.extraReducers(builder, extraDeps as SliceExtra<TExtra>);
            },
        }).reducer;

    return { actions, name, getInitialState, prepareReducer };
};

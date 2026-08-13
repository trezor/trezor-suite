import {
    type ActionReducerMapBuilder,
    type CreateSliceOptions,
    type SliceCaseReducers,
    createSlice,
} from '@reduxjs/toolkit';

/*
This is nearly same function as createSlice from redux-toolkit, but instead of generating reducer it will generate
prepareReducer function that will be used to generate reducer. This functions accepts one argument - extra dependencies.
*/
type SliceExtra<TExtra> = [TExtra] extends [void] ? Record<never, never> : TExtra;

/**
 * Stands in for one injected member during the pass that only exists to generate the action creators.
 * It has to serve every use a slice can make of an injected member — an action type, an action
 * creator, or a reducer — because the shape of `TExtra` is up to the slice and unknowable here.
 */
const createNotImplementedMember = (path: string) => {
    const type = `${path}/notImplemented/youShouldNeverSeeThisActionDispatched`;

    // Callable, so it can stand in for an injected reducer, and carrying what `builder.addCase` and
    // `isAnyOf` read off an action creator.
    const member = () => {};

    return Object.assign(member, { type, match: () => false, toString: () => type });
};

/**
 * An `extra` that answers any property path, so the generating pass works whatever `TExtra` declares.
 * Nothing it returns can reach a dispatched action: this reducer is thrown away.
 */
const createNotImplementedExtra = (sliceName: string): any =>
    new Proxy(
        {},
        {
            get: (_target, group) =>
                new Proxy(
                    {},
                    {
                        get: (_groupTarget, member) =>
                            createNotImplementedMember(
                                `${sliceName}/${String(group)}/${String(member)}`,
                            ),
                    },
                ),
        },
    );

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
    // because we don't have extra injected, we need to "mock" them in order to generate everything else except reducer
    const notImplementedExtra: SliceExtra<TExtra> = createNotImplementedExtra(options.name);

    const { actions, name, getInitialState } = createSlice({
        ...options,
        extraReducers: builder => {
            options.extraReducers(builder, notImplementedExtra);
        },
    });

    // The whole dependency object is handed over as-is: what the callback may read off it is decided
    // by `TExtra`, not by picking keys here.
    const prepareReducer = (extraDeps: SliceExtra<TExtra>) =>
        createSlice({
            ...options,
            extraReducers: builder => {
                options.extraReducers(builder, extraDeps);
            },
        }).reducer;

    return { actions, name, getInitialState, prepareReducer };
};

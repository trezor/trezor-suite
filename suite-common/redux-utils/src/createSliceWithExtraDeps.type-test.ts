import { type ActionTypesDep, type ReducersDep } from './createReducerWithExtraDeps';
import { createSliceWithExtraDeps } from './createSliceWithExtraDeps';

type SelectedSliceDeps = ActionTypesDep<'selectedAction'> & ReducersDep<'selectedReducer'>;

createSliceWithExtraDeps({
    name: 'dependency-free',
    initialState: { value: 0 },
    reducers: {},
    extraReducers: (_builder, extra) => {
        // @ts-expect-error Dependency-free slices cannot access injected action types.
        void extra.actionTypes;
    },
}).prepareReducer(null);

createSliceWithExtraDeps({
    name: 'selected-dependencies',
    initialState: { value: 0 },
    reducers: {},
    extraReducers: (_builder, extra: SelectedSliceDeps) => {
        void extra.actionTypes.selectedAction;
        void extra.reducers.selectedReducer;

        // @ts-expect-error Slices can access only explicitly declared action types.
        void extra.actionTypes.unselectedAction;

        // @ts-expect-error Slices can access only explicitly declared child reducers.
        void extra.reducers.unselectedReducer;
    },
}).prepareReducer({
    actionTypes: { selectedAction: 'test/selected-action' },
    reducers: { selectedReducer: () => {} },
});

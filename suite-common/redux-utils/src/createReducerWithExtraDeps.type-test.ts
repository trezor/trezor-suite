import {
    type ActionTypesDep,
    type ReducersDep,
    createReducerWithExtraDeps,
} from './createReducerWithExtraDeps';

type SelectedReducerDeps = ActionTypesDep<'selectedAction'> & ReducersDep<'selectedReducer'>;
type TestState = { value: number };

createReducerWithExtraDeps({ value: 0 }, (_builder, extra) => {
    // @ts-expect-error Dependency-free reducers cannot access injected action types.
    void extra.actionTypes;
})(null);

createReducerWithExtraDeps<TestState, SelectedReducerDeps>({ value: 0 }, (_builder, extra) => {
    void extra.actionTypes.selectedAction;
    void extra.reducers.selectedReducer;

    // @ts-expect-error Reducers can access only explicitly declared action types.
    void extra.actionTypes.unselectedAction;

    // @ts-expect-error Reducers can access only explicitly declared child reducers.
    void extra.reducers.unselectedReducer;
})({
    actionTypes: { selectedAction: 'test/selected-action' },
    reducers: { selectedReducer: () => {} },
});

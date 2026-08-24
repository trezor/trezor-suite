import { type ThunkDispatch, type UnknownAction } from '@reduxjs/toolkit';

import { createThunk } from './createThunk';

type SelectedExtraDependencies = {
    services: {
        selectedDependency: () => void;
    };
};

type SelectedState = {
    selected: {
        value: string;
    };
};

type UnselectedState = {
    unselected: {
        value: string;
    };
};

const selectSelectedValue = (state: SelectedState) => state.selected.value;
const selectUnselectedValue = (state: UnselectedState) => state.unselected.value;

createThunk<void, void, void>('test/noDependencies', (_, { extra, getState }) => {
    // @ts-expect-error The thunk has no state dependencies.
    selectSelectedValue(getState());

    // @ts-expect-error The thunk has no extra dependencies.
    void extra.services.analytics;
});

createThunk<void, void, { state: SelectedState }>(
    'test/selectedStateWithoutExtraDependencies',
    (_, { extra, getState }) => {
        const selectedValue: string = selectSelectedValue(getState());

        // @ts-expect-error The thunk has no extra dependencies.
        void extra.services.analytics;

        void selectedValue;
    },
);

createThunk('test/omittedConfigHasNoDependencies', (_, { extra, getState }) => {
    // @ts-expect-error An omitted config does not grant access to state.
    selectSelectedValue(getState());

    // @ts-expect-error An omitted config does not grant access to extra dependencies.
    void extra.services.analytics;
});

createThunk<void, void, { rejectValue: string }>(
    'test/configWithoutStateOrDependencies',
    (_, { extra, getState }) => {
        // @ts-expect-error The config does not declare a state dependency.
        selectSelectedValue(getState());

        // @ts-expect-error The config does not declare extra dependencies.
        void extra.services.analytics;
    },
);

createThunk<void, void, { state: SelectedState; extra: SelectedExtraDependencies }>(
    'test/selectiveExtraDependencies',
    (_, { extra, getState }) => {
        const selectedValue: string = selectSelectedValue(getState());
        extra.services.selectedDependency();

        // @ts-expect-error The thunk only has access to its explicitly selected state.
        const unselectedValue = selectUnselectedValue(getState());

        // @ts-expect-error The thunk only has access to its explicitly selected dependencies.
        const unselectedAnalytics = extra.services.analytics;

        void selectedValue;
        void unselectedValue;
        void unselectedAnalytics;
    },
);

// A dispatched child thunk does not inherit the parent's permissions. Giving it a separate state
// and dependency contract lets these tests verify that the parent covers the entire dispatch chain.
type ChildThunkState = {
    child: {
        value: number;
    };
};

type ChildThunkDeps = {
    services: {
        childDependency: () => void;
    };
};

const selectChildValue = (state: ChildThunkState) => state.child.value;

const childThunk = createThunk<void, void, { state: ChildThunkState; extra: ChildThunkDeps }>(
    'test/child',
    (_, { extra, getState }) => {
        const childValue: number = selectChildValue(getState());
        extra.services.childDependency();

        void childValue;
    },
);

// The parent can execute the child, so its public contract must contain everything required by both
// thunks. These intersections describe that combined contract.
type ParentThunkState = SelectedState & ChildThunkState;
type ParentThunkDeps = SelectedExtraDependencies & ChildThunkDeps;

const parentThunk = createThunk<void, void, { state: ParentThunkState; extra: ParentThunkDeps }>(
    'test/parent',
    (_, { dispatch, extra, getState }) => {
        const selectedValue: string = selectSelectedValue(getState());
        const childValue: number = selectChildValue(getState());
        extra.services.selectedDependency();
        extra.services.childDependency();
        dispatch(childThunk());

        void selectedValue;
        void childValue;
    },
);

// A store satisfying the complete parent-and-child contract must be able to dispatch the parent.
declare const compatibleDispatch: ThunkDispatch<ParentThunkState, ParentThunkDeps, UnknownAction>;
compatibleDispatch(parentThunk());

// Conversely, dispatching the parent must fail when the store is missing either part of the
// child's contract, even though the missing requirement is used only by the nested child thunk.
declare const dispatchWithoutChildState: ThunkDispatch<
    SelectedState,
    ParentThunkDeps,
    UnknownAction
>;
// @ts-expect-error The store does not contain the state required by the dispatched child thunk.
dispatchWithoutChildState(parentThunk());

declare const dispatchWithoutChildDependencies: ThunkDispatch<
    ParentThunkState,
    SelectedExtraDependencies,
    UnknownAction
>;
// @ts-expect-error The store does not provide the dependency required by the dispatched child thunk.
dispatchWithoutChildDependencies(parentThunk());

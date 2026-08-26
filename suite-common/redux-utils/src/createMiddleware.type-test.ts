import { type UnknownAction } from '@reduxjs/toolkit';

import { createMiddlewareWithExtraDeps } from './createMiddleware';
import { createThunk } from './createThunk';

type SelectedExtraDependencies = {
    services: {
        selectedDependency: () => void;
    };
};

type SelectedState = {
    selectedState: string;
};

const selectSelectedState = (state: SelectedState) => state.selectedState;

const statefulThunk = createThunk<void, void, { state: SelectedState }>(
    'test/statefulThunk',
    (_, { getState }) => {
        void selectSelectedState(getState());
    },
);

// @ts-expect-error All middleware types must always be specified explicitly.
createMiddlewareWithExtraDeps(action => action);

// @ts-expect-error Action and state types must always be specified explicitly.
createMiddlewareWithExtraDeps<void>(action => action);

// @ts-expect-error State type must always be specified explicitly.
createMiddlewareWithExtraDeps<void, UnknownAction>(action => action);

createMiddlewareWithExtraDeps<void, UnknownAction, void>((action, api) => {
    // @ts-expect-error Dependency-free middleware cannot access injected dependencies.
    void api.extra;

    // @ts-expect-error State-free middleware cannot read Redux state.
    void api.getState().selectedState;

    // A middleware does not inherit the state requirements of a thunk it dispatches.
    api.dispatch(statefulThunk());

    return action;
})(() => ({}));

createMiddlewareWithExtraDeps<SelectedExtraDependencies, UnknownAction, void>(
    (action, { extra }) => {
        extra.services.selectedDependency();

        // @ts-expect-error Middleware can access only its explicitly declared dependencies.
        void extra.services.unselectedDependency;

        return action;
    },
)(() => ({ services: { selectedDependency: () => {} } }));

createMiddlewareWithExtraDeps<SelectedExtraDependencies, UnknownAction, SelectedState>(
    (action, { getState }) => {
        const getSelectedState: () => SelectedState = getState;
        const { selectedState } = getSelectedState();

        // @ts-expect-error Middleware can access only its explicitly declared state.
        void getSelectedState().unselectedState;

        void selectedState;

        return action;
    },
)(() => ({ services: { selectedDependency: () => {} } }));

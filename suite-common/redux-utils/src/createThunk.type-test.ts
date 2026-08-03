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

createThunk('test/defaultDependencies', (_, { extra }) => {
    void extra.services.analytics;
});

createThunk<void, void, { rejectValue: string }>(
    'test/defaultDependenciesWithThunkConfig',
    (_, { extra }) => {
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

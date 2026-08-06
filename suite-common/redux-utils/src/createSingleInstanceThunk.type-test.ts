import { createSingleInstanceThunk } from './createSingleInstanceThunk';

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

createSingleInstanceThunk<void, void, void>('test/noDependencies', (_, { extra, getState }) => {
    // @ts-expect-error The thunk has no state dependencies.
    selectSelectedValue(getState());

    // @ts-expect-error The thunk has no extra dependencies.
    void extra.services.analytics;
});

createSingleInstanceThunk('test/defaultNoDependencies', (_, { extra, getState }) => {
    // @ts-expect-error The thunk has no state dependencies by default.
    selectSelectedValue(getState());

    // @ts-expect-error The thunk has no extra dependencies by default.
    void extra.services.analytics;
});

createSingleInstanceThunk<void, void, { state: SelectedState }>(
    'test/selectedStateWithoutExtraDependencies',
    (_, { extra, getState }) => {
        const selectedValue: string = selectSelectedValue(getState());

        // @ts-expect-error The thunk has no extra dependencies.
        void extra.services.analytics;

        void selectedValue;
    },
);

createSingleInstanceThunk<void, void, { extra: SelectedExtraDependencies }>(
    'test/selectedExtraWithoutStateDependencies',
    (_, { extra, getState }) => {
        extra.services.selectedDependency();

        // @ts-expect-error The thunk has no state dependencies.
        selectSelectedValue(getState());
    },
);

createSingleInstanceThunk<void, void, { state: SelectedState; extra: SelectedExtraDependencies }>(
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

const childThunk = createSingleInstanceThunk<string, string, void>('test/childThunk', value =>
    Promise.resolve(value),
);

createSingleInstanceThunk<void, string, void>('test/parentThunk', (_, { dispatch }) =>
    dispatch(childThunk('value')).unwrap(),
);

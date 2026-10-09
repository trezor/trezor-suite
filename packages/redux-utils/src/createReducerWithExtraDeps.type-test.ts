import { type EnhancedStore, type UnknownAction } from '@reduxjs/toolkit';

import {
    type ActionTypesDep,
    type ReducersDep,
    castExtraStore,
    createReducerWithExtraDeps,
} from './createReducerWithExtraDeps';
import { createThunk } from './createThunk';

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

type StoreState = {
    selected: {
        value: string;
    };
    unrelated: {
        value: number;
    };
};
type UnavailableState = {
    unavailable: {
        value: string;
    };
};
type StoreExtra = {
    services: {
        selectedDependency: () => void;
        unrelatedDependency: () => void;
    };
};
type UnavailableExtra = {
    services: {
        unavailableDependency: () => void;
    };
};
type ThunkArgument = { value: number };
type ThunkPayload = { value: string };

const compatibleThunk = createThunk<
    ThunkPayload,
    ThunkArgument,
    { state: StoreState; extra: StoreExtra }
>('test/compatibleThunk', () => ({ value: 'result' }));
const incompatibleStateThunk = createThunk<void, void, { state: UnavailableState }>(
    'test/incompatibleStateThunk',
    () => {},
);
const incompatibleExtraThunk = createThunk<void, void, { extra: UnavailableExtra }>(
    'test/incompatibleExtraThunk',
    () => {},
);

declare const reduxStore: EnhancedStore<StoreState, UnknownAction>;
declare const storeExtra: StoreExtra;

const storeWithExtra = castExtraStore(reduxStore, storeExtra);
const state: StoreState = storeWithExtra.store.getState();
const { extra }: { extra: StoreExtra } = storeWithExtra;

const plainAction = storeWithExtra.store.dispatch({ type: 'test', payload: 1 });
const { payload: actionPayload }: { payload: number } = plainAction;

const thunkPromise = storeWithExtra.store.dispatch(compatibleThunk({ value: 1 }));
const { requestId }: { requestId: string } = thunkPromise;
const { arg: argument }: { arg: ThunkArgument } = thunkPromise;
const unwrappedPayload: Promise<ThunkPayload> = thunkPromise.unwrap();

thunkPromise.abort();
thunkPromise.then(action => {
    if (compatibleThunk.fulfilled.match(action)) {
        const { payload }: { payload: ThunkPayload } = action;
        const { arg: actionArgument }: { arg: ThunkArgument } = action.meta;

        void payload;
        void actionArgument;
    }
});

// @ts-expect-error The store does not provide the state required by this thunk.
storeWithExtra.store.dispatch(incompatibleStateThunk());

// @ts-expect-error The store does not provide the extra dependency required by this thunk.
storeWithExtra.store.dispatch(incompatibleExtraThunk());

// @ts-expect-error Dispatch only accepts Redux actions or compatible thunks.
storeWithExtra.store.dispatch('not an action');

void state;
void extra;
void actionPayload;
void requestId;
void argument;
void unwrappedPayload;

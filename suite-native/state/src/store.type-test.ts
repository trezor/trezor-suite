import { type ThunkAction, type UnknownAction } from '@reduxjs/toolkit';

import { type FullPersistedAppState, type Store, type StoreWithExtra } from './store';

const verifyStoreType = (store: Store) => {
    const state: FullPersistedAppState = store.getState();
    const { payload }: { payload: number } = store.dispatch({ type: 'test', payload: 1 });

    const thunk: ThunkAction<
        string,
        FullPersistedAppState,
        StoreWithExtra['extra'],
        UnknownAction
    > = (_dispatch, _getState, { services }) => {
        const typedServices: StoreWithExtra['services'] = services;

        void typedServices;

        return 'result';
    };
    const thunkResult: string = store.dispatch(thunk);

    // @ts-expect-error Dispatch only accepts Redux actions or compatible thunks.
    store.dispatch('not an action');

    void state;
    void payload;
    void thunkResult;
};

void verifyStoreType;

import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';

import { prepareThpReducer, thpActions } from '../src';
import { ThpState } from '../src/thpReducer';

const thpReduce = prepareThpReducer(extraDependenciesMock);

const initialState: ThpState = {
    step: null,
    lastThpCode: undefined,
    credentials: [],
};

describe('thpReducer', () => {
    it('sets the lastThpCode', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ thp: thpReduce }),
            preloadedState: { bluetooth: initialState },
        });

        expect(store.getState().thp.lastThpCode).toEqual(undefined);
        store.dispatch(thpActions.setLastThpCode({ code: '123456' }));
        expect(store.getState().thp.lastThpCode).toEqual('123456');
    });
});

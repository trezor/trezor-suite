import { combineReducers } from '@reduxjs/toolkit';

import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';

import { prepareThpReducer, selectThpStep, thpActions } from '../src';
import { createCredential } from '../src/support/mocks';
import { ThpState } from '../src/thpReducer';
import { selectThpLastResult } from '../src/thpSelectors';

const thpReduce = prepareThpReducer(extraDependenciesCommonMock);

const initialState: ThpState = {
    step: null,
    lastThpCode: undefined,
    lastResult: undefined,
    credentials: [],
};

const credential1 = createCredential({ credential: '1' });
const credential2 = createCredential({ credential: '2' });
const credential3 = createCredential({ credential: '3' });

describe('thpReducer', () => {
    it('sets the lastThpCode', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ thp: thpReduce }),
            preloadedState: { thp: initialState },
        });

        expect(store.getState().thp.lastThpCode).toEqual(undefined);
        store.dispatch(thpActions.setLastThpCode({ code: '123456' }));
        expect(store.getState().thp.lastThpCode).toEqual('123456');
    });

    test('finishThpFlow', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ thp: thpReduce }),
            preloadedState: { thp: { ...initialState, step: 'ConfirmOnlyConnection' } },
        });

        store.dispatch(thpActions.finishThpFlow());

        const state = store.getState();
        expect(selectThpStep(state)).toEqual(null);
        expect(selectThpLastResult(state)).toEqual('finished');
    });

    test('cancelThpFlow', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ thp: thpReduce }),
            preloadedState: { thp: { ...initialState, step: 'ConfirmOnlyConnection' } },
        });

        store.dispatch(thpActions.cancelThpFlow());

        const state = store.getState();
        expect(selectThpStep(state)).toEqual(null);
        expect(selectThpLastResult(state)).toEqual('canceled');
    });

    it('filters out the credentials to be removed', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ thp: thpReduce }),
            preloadedState: {
                thp: {
                    ...initialState,
                    credentials: [credential1, credential2],
                },
            },
        });

        expect(store.getState().thp.credentials.map(it => it.credential)).toEqual(['1', '2']);

        store.dispatch(thpActions.removeCredentials({ credentials: [credential3] }));
        expect(store.getState().thp.credentials.map(it => it.credential)).toEqual(['1', '2']);

        store.dispatch(thpActions.removeCredentials({ credentials: [credential1] }));
        expect(store.getState().thp.credentials.map(it => it.credential)).toEqual(['2']);
    });
});

import { combineReducers } from '@reduxjs/toolkit';

import { ThpSuiteCredentials } from '@suite-common/suite-types';
import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';

import { prepareThpReducer, thpActions } from '../src';
import { ThpState } from '../src/thpReducer';

const thpReduce = prepareThpReducer(extraDependenciesMock);

const initialState: ThpState = {
    step: null,
    lastThpCode: undefined,
    credentials: [],
};

const createCredential = (credential: string): ThpSuiteCredentials => ({
    credential,
    connectionCounter: 0,
    trezor_static_pubkey: '',
    autoconnect: false,
});

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

    it('filters out the credentials to be removed', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ thp: thpReduce }),
            preloadedState: {
                thp: {
                    ...initialState,
                    credentials: [createCredential('1'), createCredential('2')],
                },
            },
        });

        expect(store.getState().thp.credentials.map(it => it.credential)).toEqual(['1', '2']);

        store.dispatch(thpActions.removeCredentials({ credentials: [createCredential('3')] }));
        expect(store.getState().thp.credentials.map(it => it.credential)).toEqual(['1', '2']);

        store.dispatch(thpActions.removeCredentials({ credentials: [createCredential('1')] }));
        expect(store.getState().thp.credentials.map(it => it.credential)).toEqual(['2']);
    });
});

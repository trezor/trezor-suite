import { combineReducers } from '@reduxjs/toolkit';

import { mockActionType } from '@suite-common/redux-utils/mocks';
import { mockConnectDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore } from '@suite-common/test-utils';
import { DEVICE, createDeviceMessage } from '@trezor/connect';

import { createCredential, createDeviceThp } from '../mocks';
import { thpActions } from './thpActions';
import { type ThpState, prepareThpReducer } from './thpReducer';
import {
    selectThpAutoconnectStep,
    selectThpCredentials,
    selectThpLastCode,
    selectThpStep,
} from './thpSelectors';

const thpReduce = prepareThpReducer({
    actionTypes: { storageLoad: mockActionType('storageLoad') },
});

const initialState: ThpState = {
    step: null,
    autoconnectStep: null,
    lastThpCode: undefined,
    credentials: [],
};

const credential1 = createCredential({ credential: '1' });
const credential2 = createCredential({ credential: '2' });
const credential3 = createCredential({ credential: '3' });

describe('thpReducer', () => {
    test('finishThpFlow', () => {
        const store = configureMockStore({
            extra: undefined,
            reducer: combineReducers({ thp: thpReduce }),
            preloadedState: { thp: { ...initialState, step: 'ConfirmOnlyConnection' } },
        });

        store.dispatch(thpActions.finishThpFlow());

        const state = store.getState();
        expect(selectThpStep(state)).toEqual(null);
    });

    describe('THP pairing status event handling', () => {
        const device = mockConnectDevice({
            thp: createDeviceThp({}),
        });

        test.each([
            ['finished (connection counter incremented)', 1, 2, null],
            ['finished (connection counter incremented, autoconnect set)', 2, 3, 'AutoconnectInfo'],
            ['finished (connection counter not changed)', 3, 3, null],
        ])('%s', (_, initialCounter, expectedCounter, expectedAutoconnectStep) => {
            const store = configureMockStore({
                extra: undefined,
                reducer: combineReducers({ thp: thpReduce }),
                preloadedState: {
                    thp: {
                        ...initialState,
                        step: 'ConfirmOnlyConnection',
                        lastThpCode: '1234',
                        credentials: [
                            credential1,
                            { ...device.thp?.credentials[0], connectionCounter: initialCounter },
                        ],
                    },
                },
            });

            store.dispatch(
                createDeviceMessage(DEVICE.THP_PAIRING_STATUS_CHANGED, {
                    device,
                    status: 'finished',
                }),
            );

            const state = store.getState();
            expect(selectThpStep(state)).toBeNull();
            expect(selectThpAutoconnectStep(state)).toEqual(expectedAutoconnectStep);
            expect(selectThpLastCode(state)).toBeUndefined();
            expect(selectThpCredentials(state).map(c => c.connectionCounter)).toEqual([
                0,
                expectedCounter,
            ]);
        });

        test('canceled', () => {
            const store = configureMockStore({
                extra: undefined,
                reducer: combineReducers({ thp: thpReduce }),
                preloadedState: {
                    thp: { ...initialState, step: 'ConfirmOnlyConnection', lastThpCode: '1234' },
                },
            });

            store.dispatch(
                createDeviceMessage(DEVICE.THP_PAIRING_STATUS_CHANGED, {
                    device,
                    status: 'canceled',
                }),
            );

            const state = store.getState();
            expect(selectThpStep(state)).toBeNull();
            expect(selectThpLastCode(state)).toBeUndefined();
        });

        test('failed', () => {
            const store = configureMockStore({
                extra: undefined,
                reducer: combineReducers({ thp: thpReduce }),
                preloadedState: {
                    thp: { ...initialState, step: 'ConfirmOnlyConnection', lastThpCode: '1234' },
                },
            });

            store.dispatch(
                createDeviceMessage(DEVICE.THP_PAIRING_STATUS_CHANGED, {
                    device,
                    status: 'failed',
                    message: 'foo',
                }),
            );

            const state = store.getState();
            expect(selectThpStep(state)).toBeNull();
            expect(selectThpLastCode(state)).toBeUndefined();
        });

        test('invalid-tag', () => {
            const store = configureMockStore({
                extra: undefined,
                reducer: combineReducers({ thp: thpReduce }),
                preloadedState: {
                    thp: initialState,
                },
            });

            store.dispatch(
                createDeviceMessage(DEVICE.THP_PAIRING_STATUS_CHANGED, {
                    device,
                    status: 'invalid-tag',
                    tag: '1234',
                }),
            );

            const state = store.getState();
            expect(selectThpStep(state)).toEqual('CodeInvalid');
            expect(selectThpLastCode(state)).toEqual('1234');
        });
    });

    it('filters out the credentials to be removed', () => {
        const store = configureMockStore({
            extra: undefined,
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

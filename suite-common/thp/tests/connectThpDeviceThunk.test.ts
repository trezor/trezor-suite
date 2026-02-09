import { combineReducers } from '@reduxjs/toolkit';

import { FirmwareUpdateState, prepareFirmwareReducer } from '@suite-common/firmware';
import { configureMockStore, extraDependenciesCommonMock } from '@suite-common/test-utils';
import { Device } from '@trezor/connect';

import { connectThpDeviceThunk } from '../src/connectThpDeviceThunk';
import { createCredential, createDeviceThp } from '../src/support/mocks';
import { ThpState, prepareThpReducer } from '../src/thpReducer';

const thpReduce = prepareThpReducer(extraDependenciesCommonMock);
const firmwareReduce = prepareFirmwareReducer(extraDependenciesCommonMock);

const thpCredential1 = createCredential({ credential: 'credential-1', connectionCounter: 2 });
const thpCredential2 = createCredential({ credential: 'credential-2' });

const initialThpState: ThpState = {
    step: null,
    autoconnectStep: null,
    lastThpCode: undefined,
    credentials: [thpCredential1, thpCredential2],
};

const initialFirmwareState: FirmwareUpdateState = {
    error: '',
    cachedDevice: undefined,
    status: 'initial',
    targetType: undefined,
    uiEvent: undefined,
    useDevkit: false,
    firmwareChannel: 'production',
    switchFirmwareType: false,
};

const device: Pick<Device, 'thp'> = {
    thp: { ...createDeviceThp(), credentials: [thpCredential1] },
};

describe(connectThpDeviceThunk.name, () => {
    it.each([
        [1, 2, null],
        [2, 3, 'AutoconnectInfo'],
        [3, 3, null],
    ])(
        'updates the connection counter, unless the threshold has already been reached',
        (initialCounter, expectedCounter, expectedStep) => {
            const store = configureMockStore({
                extra: {},
                reducer: combineReducers({ thp: thpReduce, firmware: firmwareReduce }),
                preloadedState: {
                    thp: {
                        ...initialThpState,
                        step: 'ConfirmOnlyConnection',
                        credentials: [
                            { ...thpCredential1, connectionCounter: initialCounter },
                            thpCredential2,
                        ],
                    },
                    firmware: initialFirmwareState,
                },
            });

            store.dispatch(connectThpDeviceThunk({ device }));
            expect(store.getState().thp.credentials[0].connectionCounter).toEqual(expectedCounter);
            expect(store.getState().thp.credentials[1].connectionCounter).toEqual(0);
            expect(store.getState().thp.autoconnectStep).toEqual(expectedStep);
        },
    );

    it('does not update the connection counter without THP confirmation', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ thp: thpReduce, firmware: firmwareReduce }),
            preloadedState: { thp: initialThpState, firmware: initialFirmwareState },
        });

        store.dispatch(connectThpDeviceThunk({ device }));
        expect(store.getState().thp.credentials[0].connectionCounter).toEqual(2);
        expect(store.getState().thp.credentials[1].connectionCounter).toEqual(0);
        expect(store.getState().thp.step).toEqual(null);
    });

    it('does not update the connection counter during firmware installation', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ thp: thpReduce, firmware: firmwareReduce }),
            preloadedState: {
                thp: { ...initialThpState, step: 'ConfirmOnlyConnection' },
                firmware: { ...initialFirmwareState, status: 'done' },
            },
        });

        store.dispatch(connectThpDeviceThunk({ device }));
        expect(store.getState().thp.credentials[0].connectionCounter).toEqual(2);
        expect(store.getState().thp.credentials[1].connectionCounter).toEqual(0);
        expect(store.getState().thp.step).toEqual(null);
    });
});

import { combineReducers } from '@reduxjs/toolkit';

import { FirmwareUpdateState, prepareFirmwareReducer } from '@suite-common/firmware';
import { configureMockStore, extraDependenciesMock, testMocks } from '@suite-common/test-utils';
import { Device } from '@trezor/connect';

import { connectThpDeviceThunk } from '../src/connectThpDeviceThunk';
import { createCredential, createDeviceThp } from '../src/support/mocks';
import { ThpState, prepareThpReducer } from '../src/thpReducer';

const thpReduce = prepareThpReducer(extraDependenciesMock);
const firmwareReduce = prepareFirmwareReducer(extraDependenciesMock);

const thpCredential1 = createCredential({ credential: 'credential-1' });
const thpCredential2 = createCredential({ credential: 'credential-2' });

const initialThpState: ThpState = {
    step: null,
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
    firmwareUpdateSource: 'production',
};

const device: Pick<Device, 'thp' | 'features'> = {
    thp: { ...createDeviceThp(), credentials: [thpCredential1] },
    features: testMocks.getDeviceFeatures(),
};

describe(connectThpDeviceThunk.name, () => {
    it('updates the connection counter for credential', () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ thp: thpReduce, firmware: firmwareReduce }),
            preloadedState: { thp: initialThpState, firmware: initialFirmwareState },
        });

        store.dispatch(connectThpDeviceThunk({ device }));
        expect(store.getState().thp.credentials[0].connectionCounter).toEqual(1);
        expect(store.getState().thp.credentials[1].connectionCounter).toEqual(0);
        expect(store.getState().thp.step).toEqual(null);

        store.dispatch(connectThpDeviceThunk({ device }));
        expect(store.getState().thp.credentials[0].connectionCounter).toEqual(2);
        expect(store.getState().thp.credentials[1].connectionCounter).toEqual(0);
        expect(store.getState().thp.step).toEqual(null);

        store.dispatch(connectThpDeviceThunk({ device }));
        expect(store.getState().thp.credentials[0].connectionCounter).toEqual(3);
        expect(store.getState().thp.credentials[1].connectionCounter).toEqual(0);
        expect(store.getState().thp.step).toEqual('AutoconnectInfo');

        store.dispatch(connectThpDeviceThunk({ device }));
        expect(store.getState().thp.credentials[0].connectionCounter).toEqual(4);
        expect(store.getState().thp.credentials[1].connectionCounter).toEqual(0);
        expect(store.getState().thp.step).toEqual(null);
    });

    it("won't update the connection counter for credential during Firmware Installation", () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ thp: thpReduce, firmware: firmwareReduce }),
            preloadedState: {
                thp: initialThpState,
                firmware: { ...initialFirmwareState, status: 'done' },
            },
        });

        store.dispatch(connectThpDeviceThunk({ device }));
        expect(store.getState().thp.credentials[0].connectionCounter).toEqual(0);
        expect(store.getState().thp.credentials[1].connectionCounter).toEqual(0);
        expect(store.getState().thp.step).toEqual(null);
    });

    it("won't update the connection counter for credential when not initialized", () => {
        const store = configureMockStore({
            extra: {},
            reducer: combineReducers({ thp: thpReduce, firmware: firmwareReduce }),
            preloadedState: { thp: initialThpState, firmware: initialFirmwareState },
        });

        const nonInitializedDevice = {
            ...device,
            features: { ...testMocks.getDeviceFeatures(), initialized: false },
        };

        store.dispatch(connectThpDeviceThunk({ device: nonInitializedDevice }));
        expect(store.getState().thp.credentials[0].connectionCounter).toEqual(0);
        expect(store.getState().thp.credentials[1].connectionCounter).toEqual(0);
        expect(store.getState().thp.step).toEqual(null);
    });
});

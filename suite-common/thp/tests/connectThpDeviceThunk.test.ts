import { combineReducers } from '@reduxjs/toolkit';

import { FirmwareUpdateState, prepareFirmwareReducer } from '@suite-common/firmware';
import { ThpSuiteCredentials } from '@suite-common/suite-types';
import { configureMockStore, extraDependenciesMock } from '@suite-common/test-utils';
import { Device } from '@trezor/connect';

import { connectThpDeviceThunk } from '../src/connectThpDeviceThunk';
import { ThpState, prepareThpReducer } from '../src/thpReducer';

const thpReduce = prepareThpReducer(extraDependenciesMock);
const firmwareReduce = prepareFirmwareReducer(extraDependenciesMock);

const thpCredential1: ThpSuiteCredentials = {
    connectionCounter: 0,
    credential: 'credential-1',
    autoconnect: false,
    trezor_static_pubkey: 'pubkey-1',
};

const thpCredential2: ThpSuiteCredentials = {
    connectionCounter: 0,
    credential: 'credential-2',
    autoconnect: false,
    trezor_static_pubkey: 'pubkey-2',
};

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
};

const device: Pick<Device, 'thp'> = {
    thp: {
        credentials: [thpCredential1],
        properties: {
            internal_model: 'T3W1',
            model_variant: 0,
            protocol_version_major: 10,
            protocol_version_minor: 20,
            pairing_methods: [],
        },
        channel: '',
        sendBit: 0,
        recvBit: 0,
        sendNonce: 0,
        recvNonce: 0,
        expectedResponses: [],
    },
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

    it('wont updates the connection counter for credential during Firmware Installation', () => {
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
});

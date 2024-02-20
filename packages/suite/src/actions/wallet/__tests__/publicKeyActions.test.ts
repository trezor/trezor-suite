import { combineReducers, createReducer } from '@reduxjs/toolkit';

import { configureMockStore, testMocks } from '@suite-common/test-utils';
import { connectInitThunk } from '@suite-common/connect-init';
import { State as DeviceState } from '@suite-common/wallet-core';

import fixtures from '../__fixtures__/publicKeyActions';

const TrezorConnect = testMocks.getTrezorConnectMock();

const setTrezorConnectFixtures = (fixture: any) => {
    let buttonRequest: ((e?: any) => any) | undefined;

    const getPublicKey = (_params: any) => {
        if (fixture && fixture.getPublicKey) {
            if (fixture.getPublicKey.success && buttonRequest) {
                buttonRequest({ code: 'ButtonRequest_PublicKey' });
            }

            return fixture.getPublicKey;
        }
        // trigger multiple button requests
        if (buttonRequest) {
            buttonRequest({ code: 'ButtonRequest_PublicKey' });
            buttonRequest({ code: 'some-other-code' });
            buttonRequest();
        }

        return {
            success: true,
        };
    };

    jest.spyOn(TrezorConnect, 'on').mockImplementation((event: string, cb) => {
        if (event === 'ui-button') buttonRequest = cb;
    });
    jest.spyOn(TrezorConnect, 'off').mockImplementation(() => {
        buttonRequest = undefined;
    });
    jest.spyOn(TrezorConnect, 'getPublicKey').mockImplementation(getPublicKey);
    jest.spyOn(TrezorConnect, 'cardanoGetPublicKey').mockImplementation(getPublicKey);
};

const device = testMocks.getSuiteDevice({
    state: 'device-state',
    connected: true,
    available: true,
});

const rootReducer = combineReducers({
    device: createReducer({ devices: [device], selectedDevice: device }, () => {}),
    wallet: combineReducers({
        selectedAccount: createReducer(
            {
                account: {
                    metadata: {},
                    networkType: 'bitcoin',
                },
            },
            () => ({}),
        ),
        accounts: createReducer([{ metadata: {}, networkType: 'bitcoin' }], () => {}),
    }),

    metadata: createReducer(
        {
            providers: [],
            selectedProvider: {},
            enabled: false,
        },
        () => ({}),
    ),
});

interface StateOverrides {
    device?: Pick<DeviceState, 'selectedDevice'>;
    networkType?: string;
}

const initStore = (stateOverrides?: StateOverrides) => {
    const preloadedState = JSON.parse(JSON.stringify(rootReducer(undefined, { type: 'init' })));
    if (stateOverrides?.device) {
        preloadedState.device = stateOverrides.device;
    }
    if (stateOverrides?.networkType) {
        preloadedState.wallet.selectedAccount.account.networkType = stateOverrides.networkType;
    }

    return configureMockStore<any>({ reducer: rootReducer, preloadedState });
};

describe('PublicKeyActions', () => {
    fixtures.forEach(f => {
        it(f.description, async () => {
            setTrezorConnectFixtures(f.mocks);
            const store = initStore(f.initialState);
            await store.dispatch(connectInitThunk());
            await store.dispatch(f.action());

            if (f.result && f.result.actions) {
                expect(store.getActions()).toMatchObject(f.result.actions);
            }
        });
    });
});

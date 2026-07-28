import { combineReducers, createReducer } from '@reduxjs/toolkit';

import { connectInitThunk } from '@suite-common/connect-init';
import type { DeviceReducerState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore, testMocks } from '@suite-common/test-utils';

import fixtures from './__fixtures__/publicKeyActions';

const device = mockSuiteDevice({
    state: { staticSessionId: '1stTestnetAddress@device_id:0' },
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
        settings: createReducer(
            {
                enabledNetworks: [],
            },
            () => ({}),
        ),
    }),

    metadata: createReducer(
        {
            providers: [],
            selectedProvider: {},
            enabled: false,
        },
        () => ({}),
    ),
    messageSystem: createReducer(messageSystemInitialState, () => ({})),
    firmware: createReducer([{ firmwareChannel: 'production' }], () => ({})),
});

interface StateOverrides {
    device?: Pick<DeviceReducerState, 'selectedDevice' | 'devices'>;
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
            testMocks.setTrezorConnectFixtures(f.mocks.getPublicKey);
            const store = initStore(f.initialState);
            await store.dispatch(connectInitThunk());
            await store.dispatch(f.action() as any);

            if (f.result?.actions) {
                expect(store.getActions()).toMatchObject(f.result.actions);
            }
        });
    });
});

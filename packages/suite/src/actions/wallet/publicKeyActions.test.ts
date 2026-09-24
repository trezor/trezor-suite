import { type UnknownAction, combineReducers, createAction, createReducer } from '@reduxjs/toolkit';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import { createConnectInit } from '@suite-common/connect-init';
import {
    mockConnectInitSettings,
    mockCreateTransports,
    mockGetDebugSettings,
    mockGetThpSettings,
} from '@suite-common/connect-init/mocks';
import type { DeviceReducerState } from '@suite-common/device';
import { messageSystemInitialState } from '@suite-common/message-system';
import {
    mockGetAllowPrerelease,
    mockGetBinFilesBaseUrl,
    mockSuiteDevice,
} from '@suite-common/suite-types/mocks';
import { createTestStore, testMocks } from '@suite-common/test-utils';
import { defaultTrezorUIEventHandlerThunk } from '@suite-common/wallet-core';
import { noopCreateLogger } from '@trezor/connect-common';

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

    return createTestStore<undefined, any, UnknownAction>({
        extra: undefined,
        reducer: rootReducer,
        preloadedState,
    });
};

const initConnect = (store: ReturnType<typeof initStore>) =>
    createConnectInit({
        dispatch: store.dispatch,
        getState: store.getState,
        analytics: mockDesktopAnalytics(),
        lockDevice: createAction<boolean>('notImplemented/lockDevice'),
        connectInitSettings: mockConnectInitSettings(),
        createLogger: noopCreateLogger,
        createTransports: mockCreateTransports(),
        getAllowPrerelease: mockGetAllowPrerelease(),
        getBinFilesBaseUrl: mockGetBinFilesBaseUrl(),
        getDebugSettings: mockGetDebugSettings(),
        getThpSettings: mockGetThpSettings(),
        trezorUiEventHandler: action => store.dispatch(defaultTrezorUIEventHandlerThunk(action)),
    })();

describe('PublicKeyActions', () => {
    fixtures.forEach(f => {
        it(f.description, async () => {
            testMocks.setTrezorConnectFixtures(f.mocks.getPublicKey);
            const store = initStore(f.initialState);
            await initConnect(store);
            await store.dispatch(f.action() as any);

            if (f.result?.actions) {
                expect(store.getActions()).toMatchObject(f.result.actions);
            }
        });
    });
});

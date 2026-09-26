import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import {
    type ConnectInitThunkDeps,
    type ConnectInitThunkState,
    connectInitThunk,
} from '@suite-common/connect-init';
import {
    mockConnectInitDeviceEventHooks,
    mockConnectInitSettings,
    mockConnectInitUiEventHooks,
    mockCreateTransports,
    mockGetDebugSettings,
    mockGetThpSettings,
} from '@suite-common/connect-init/mocks';
import { mock } from '@suite-common/dependency-injection';
import { type DeviceReducerState, deviceInitialState } from '@suite-common/device';
import { firmwareInitialState } from '@suite-common/firmware';
import { messageSystemInitialState } from '@suite-common/message-system';
import { type LockDevice } from '@suite-common/suite-types';
import {
    mockGetAllowPrerelease,
    mockGetBinFilesBaseUrl,
    mockSuiteDevice,
} from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot, testMocks } from '@suite-common/test-utils';
import { type NetworkSymbol, asNetworkSymbol, getNetwork } from '@suite-common/wallet-config';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { type SelectedAccountLoaded } from '@suite-common/wallet-types';
import { mockWalletAccount } from '@suite-common/wallet-types/mocks';
import { noopCreateLogger } from '@trezor/connect-common';

import { type ShowXpubThunkState } from 'src/actions/wallet/publicKeyActions';

import fixtures from './__fixtures__/publicKeyActions';

type PublicKeyActionsTestState = ConnectInitThunkState & ShowXpubThunkState;

type StateOverrides = {
    device?: Pick<DeviceReducerState, 'selectedDevice' | 'devices'>;
    symbol?: NetworkSymbol;
};

const device = mockSuiteDevice({
    state: { staticSessionId: '1stTestnetAddress@device_id:0' },
    connected: true,
    available: true,
});

const mockSelectedAccount = (symbol: NetworkSymbol): SelectedAccountLoaded => ({
    status: 'loaded',
    account: mockWalletAccount({ symbol }),
    network: getNetwork(symbol),
    params: { symbol, accountIndex: 0, accountType: 'normal' },
});

const getInitialState = (overrides: StateOverrides = {}): PublicKeyActionsTestState => ({
    device: {
        ...deviceInitialState,
        ...(overrides.device ?? { devices: [device], selectedDevice: device }),
    },
    firmware: firmwareInitialState,
    messageSystem: messageSystemInitialState,
    wallet: {
        settings: initialWalletSettingsState,
        accounts: [],
        selectedAccount: mockSelectedAccount(overrides.symbol ?? asNetworkSymbol('btc')),
    },
});

const createTestRoot = (overrides?: StateOverrides) =>
    createTestCompositionRoot<ConnectInitThunkDeps, PublicKeyActionsTestState>({
        services: () => ({
            analytics: mockDesktopAnalytics(),
            connectInitDeviceEventHooks: mockConnectInitDeviceEventHooks(),
            connectInitSettings: mockConnectInitSettings(),
            connectInitUiEventHooks: mockConnectInitUiEventHooks(),
            createLogger: noopCreateLogger,
            createTransports: mockCreateTransports(),
            getAllowPrerelease: mockGetAllowPrerelease(),
            getBinFilesBaseUrl: mockGetBinFilesBaseUrl(),
            getDebugSettings: mockGetDebugSettings(),
            getThpSettings: mockGetThpSettings(),
            lockDevice: mock<LockDevice>(),
        }),
        preloadedState: getInitialState(overrides),
    });

describe('PublicKeyActions', () => {
    fixtures.forEach(f => {
        it(f.description, async () => {
            testMocks.setTrezorConnectFixtures(f.mocks.getPublicKey);
            const { services } = createTestRoot(f.initialState);
            await services.store.dispatch(connectInitThunk());
            await services.store.dispatch(f.action() as any);

            if (f.result?.actions) {
                expect(services.store.getActions()).toMatchObject(f.result.actions);
            }
        });
    });
});

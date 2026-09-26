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
import { deviceInitialState } from '@suite-common/device';
import { firmwareInitialState } from '@suite-common/firmware';
import { messageSystemInitialState } from '@suite-common/message-system';
import { type LockDevice } from '@suite-common/suite-types';
import { mockGetAllowPrerelease, mockGetBinFilesBaseUrl } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot, testMocks } from '@suite-common/test-utils';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { BLOCKCHAIN_EVENT, DEVICE_EVENT, TRANSPORT_EVENT, UI_EVENT } from '@trezor/connect';
import { noopCreateLogger } from '@trezor/connect-common';

const getInitialState = (): ConnectInitThunkState => ({
    device: deviceInitialState,
    firmware: firmwareInitialState,
    messageSystem: messageSystemInitialState,
    wallet: { settings: initialWalletSettingsState },
});

const createTestRoot = (lockDevice = mock<LockDevice>()) =>
    createTestCompositionRoot<ConnectInitThunkDeps, ConnectInitThunkState>({
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
            lockDevice,
        }),
        preloadedState: getInitialState(),
    });

describe('TrezorConnect Actions', () => {
    it('Success', () => {
        const { services } = createTestRoot();
        expect(() => services.store.dispatch(connectInitThunk())).not.toThrow();
    });

    it('Error', async () => {
        testMocks.setTrezorConnectFixtures(() => {
            throw new Error('Iframe error');
        });
        const { services } = createTestRoot();
        try {
            await services.store.dispatch(connectInitThunk()).unwrap();
            throw new Error('Unreachable!');
        } catch (error) {
            expect(error.message).toEqual('Iframe error');
        }
    });

    it('Events', () => {
        const defaultSuiteType = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'desktop';
        const { services } = createTestRoot();
        expect(() => services.store.dispatch(connectInitThunk())).not.toThrow();

        const actions = services.store.getActions();
        const { emitTestEvent } = testMocks.getTrezorConnectMock();

        emitTestEvent(DEVICE_EVENT, { type: DEVICE_EVENT });
        expect(actions.pop()).toEqual({ type: DEVICE_EVENT });
        emitTestEvent(UI_EVENT, { type: UI_EVENT });
        expect(actions.pop()).toEqual({ type: UI_EVENT });
        emitTestEvent(TRANSPORT_EVENT, { type: TRANSPORT_EVENT });
        expect(actions.pop()).toEqual({ type: TRANSPORT_EVENT });
        emitTestEvent(BLOCKCHAIN_EVENT, { type: BLOCKCHAIN_EVENT });
        expect(actions.pop()).toEqual({ type: BLOCKCHAIN_EVENT });

        process.env.SUITE_TYPE = defaultSuiteType;
    });

    it('Wrapped method', async () => {
        testMocks.setTrezorConnectFixtures();
        const lockDevice = mock<LockDevice>();
        const { services } = createTestRoot(lockDevice);
        await services.store.dispatch(connectInitThunk());
        await testMocks.getTrezorConnectMock().getFeatures();

        expect(lockDevice).toHaveBeenNthCalledWith(1, true);
        expect(lockDevice).toHaveBeenNthCalledWith(2, false);
        expect(services.store.getActions().pop()).toMatchObject({
            type: '@suite/device/removeButtonRequests',
        });
    });
});

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import {
    type ConnectInitState,
    createConnectInitCompositionRoot,
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
import { type WithServices } from '@suite-common/redux-utils';
import { type ConnectInitUiEventHooksDep, type LockDevice } from '@suite-common/suite-types';
import { mockGetAllowPrerelease, mockGetBinFilesBaseUrl } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot, testMocks } from '@suite-common/test-utils';
import { initialWalletSettingsState } from '@suite-common/wallet-core';
import { BLOCKCHAIN_EVENT, DEVICE_EVENT, TRANSPORT_EVENT, UI_EVENT } from '@trezor/connect';
import { noopCreateLogger } from '@trezor/connect-common';

const getInitialState = (): ConnectInitState => ({
    device: deviceInitialState,
    firmware: firmwareInitialState,
    messageSystem: messageSystemInitialState,
    wallet: { settings: initialWalletSettingsState },
});

const createTestRoot = (lockDevice = mock<LockDevice>()) => {
    const root = createTestCompositionRoot<
        WithServices<ConnectInitUiEventHooksDep>,
        ConnectInitState
    >({
        services: () => ({ connectInitUiEventHooks: mockConnectInitUiEventHooks() }),
        preloadedState: getInitialState(),
    });
    const { connectInit } = createConnectInitCompositionRoot({
        dispatch: root.services.store.dispatch,
        getState: root.services.store.getState,
        lockDevice,
        analytics: mockDesktopAnalytics(),
        connectInitDeviceEventHooks: mockConnectInitDeviceEventHooks(),
        connectInitSettings: mockConnectInitSettings(),
        createLogger: noopCreateLogger,
        createTransports: mockCreateTransports(),
        getAllowPrerelease: mockGetAllowPrerelease(),
        getBinFilesBaseUrl: mockGetBinFilesBaseUrl(),
        getDebugSettings: mockGetDebugSettings(),
        getThpSettings: mockGetThpSettings(),
    });

    return { ...root, connectInit };
};

describe('TrezorConnect Actions', () => {
    beforeEach(() => {
        testMocks.setTrezorConnectFixtures();
    });

    it('Success', async () => {
        const { connectInit } = createTestRoot();

        await expect(connectInit()).resolves.toBeUndefined();
    });

    it('Error', async () => {
        testMocks.setTrezorConnectFixtures(() => {
            throw new Error('Iframe error');
        });
        const { connectInit } = createTestRoot();

        await expect(connectInit()).rejects.toThrow('Iframe error');
    });

    it('Events', async () => {
        const defaultSuiteType = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'desktop';
        const { connectInit, services } = createTestRoot();
        await connectInit();

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
        const lockDevice = mock<LockDevice>();
        const { connectInit, services } = createTestRoot(lockDevice);
        await connectInit();
        await testMocks.getTrezorConnectMock().getFeatures();

        expect(lockDevice).toHaveBeenNthCalledWith(1, true);
        expect(lockDevice).toHaveBeenNthCalledWith(2, false);
        expect(services.store.getActions().pop()).toMatchObject({
            type: '@suite/device/removeButtonRequests',
        });
    });
});

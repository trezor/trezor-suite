import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import {
    type ConnectInitThunkDeps,
    type ConnectInitThunkState,
    connectInitThunk,
} from '@suite-common/connect-init';
import {
    mockConnectInitHooks,
    mockConnectInitSettings,
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
import {
    BLOCKCHAIN_EVENT,
    DEVICE_EVENT,
    TRANSPORT_EVENT,
    UI_EVENT,
    UI_EVENTS,
} from '@trezor/connect';
import { noopCreateLogger } from '@trezor/connect-common';

const getInitialState = (): ConnectInitThunkState => ({
    device: deviceInitialState,
    firmware: firmwareInitialState,
    messageSystem: messageSystemInitialState,
    wallet: { settings: initialWalletSettingsState },
});

const createTestRoot = (lockDevice = mock<LockDevice>()) =>
    createTestCompositionRoot<ConnectInitThunkDeps, ConnectInitThunkState>({
        extra: {
            services: {
                analytics: mockDesktopAnalytics(),
                connectInitHooks: mockConnectInitHooks(),
                connectInitSettings: mockConnectInitSettings(),
                createLogger: noopCreateLogger,
                createTransports: mockCreateTransports(),
                getAllowPrerelease: mockGetAllowPrerelease(),
                getBinFilesBaseUrl: mockGetBinFilesBaseUrl(),
                getDebugSettings: mockGetDebugSettings(),
                getThpSettings: mockGetThpSettings(),
                lockDevice,
            },
        },
        preloadedState: getInitialState(),
    });

describe('TrezorConnect Actions', () => {
    it('Success', () => {
        const { store } = createTestRoot();
        expect(() => store.dispatch(connectInitThunk())).not.toThrow();
    });

    it('Error', async () => {
        testMocks.setTrezorConnectFixtures(() => {
            throw new Error('Iframe error');
        });
        const { store } = createTestRoot();
        try {
            await store.dispatch(connectInitThunk()).unwrap();
            throw new Error('Unreachable!');
        } catch (error) {
            expect(error.message).toEqual('Iframe error');
        }
    });

    it('Events', () => {
        const defaultSuiteType = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'desktop';
        const { store, services } = createTestRoot();
        expect(() => store.dispatch(connectInitThunk())).not.toThrow();

        const actions = services.getActions();
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

    it('DEVICE_LOCK / DEVICE_UNLOCK UI events drive the device lock', async () => {
        testMocks.setTrezorConnectFixtures();
        const lockDevice = mock<LockDevice>();
        const { store, services } = createTestRoot(lockDevice);
        await store.dispatch(connectInitThunk());

        // connect-core emits these around any device-using call; here we emit them directly.
        const { emitTestEvent } = testMocks.getTrezorConnectMock();
        emitTestEvent(UI_EVENT, { type: UI_EVENTS.DEVICE_LOCK });
        emitTestEvent(UI_EVENT, { type: UI_EVENTS.DEVICE_UNLOCK });

        expect(lockDevice).toHaveBeenNthCalledWith(1, true);
        expect(lockDevice).toHaveBeenNthCalledWith(2, false);
        expect(services.getActions().pop()).toMatchObject({
            type: '@suite/device/removeButtonRequests',
        });
    });
});

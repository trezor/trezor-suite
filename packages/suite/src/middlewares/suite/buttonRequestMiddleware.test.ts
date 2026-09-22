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
import { deviceActions, deviceInitialState } from '@suite-common/device';
import { firmwareInitialState } from '@suite-common/firmware';
import { messageSystemInitialState } from '@suite-common/message-system';
import { mockSuiteSync } from '@suite-common/suite-sync/mocks';
import { type LockDevice } from '@suite-common/suite-types';
import {
    mockGetAllowPrerelease,
    mockGetBinFilesBaseUrl,
    mockSuiteDevice,
} from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot, testMocks } from '@suite-common/test-utils';
import {
    defaultTrezorUIEventHandlerThunk,
    initialWalletSettingsState,
    observeSelectedDeviceThunk,
} from '@suite-common/wallet-core';
import { UI_EVENT, UI_EVENTS, UI_REQUEST, UI_REQUESTS } from '@trezor/connect';
import { noopCreateLogger } from '@trezor/connect-common';

import * as deviceSettingsActions from 'src/actions/settings/deviceSettingsActions';
import buttonRequestMiddleware from 'src/middlewares/suite/buttonRequestMiddleware';
import { prepareSuiteMiddleware } from 'src/middlewares/suite/suiteMiddleware';

const device = mockSuiteDevice();

const getInitialState = (): ConnectInitThunkState => ({
    device: { ...deviceInitialState, devices: [device], selectedDevice: device },
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
        middleware: [
            prepareSuiteMiddleware(() => ({ services: { suiteSync: mockSuiteSync() } })),
            buttonRequestMiddleware,
        ],
        preloadedState: getInitialState(),
    });

describe('buttonRequest middleware', () => {
    it('see what happens on pin change call', async () => {
        const lockDevice = mock<LockDevice>();
        const { store, services } = createTestRoot(lockDevice);
        await store.dispatch(connectInitThunk());
        const call = store.dispatch(deviceSettingsActions.changePinThunk({ remove: false }));
        const { emitTestEvent } = testMocks.getTrezorConnectMock();
        // connect-core locks the device when a device-using method starts talking to it
        emitTestEvent(UI_EVENT, { type: UI_EVENTS.DEVICE_LOCK });
        // fake few ui events, just like when user is changing PIN
        emitTestEvent(UI_EVENT, {
            type: UI_EVENTS.BUTTON_REQUEST,
            payload: { code: 'ButtonRequest_ProtectCall' },
        });
        emitTestEvent(UI_REQUEST, {
            type: UI_REQUESTS.REQUEST_PIN,
            payload: { type: 'PinMatrixRequestType_NewFirst', device },
        });
        // ...and unlocks it (clearing button requests) when the method finishes
        emitTestEvent(UI_EVENT, { type: UI_EVENTS.DEVICE_UNLOCK });

        await call;

        // Not interested in noisy lifecycle actions from reduxJS toolkit
        const unrelatedActionTypes = [
            observeSelectedDeviceThunk.pending.type,
            observeSelectedDeviceThunk.fulfilled.type,
        ];
        const actions = services
            .getActions()
            .filter(action => !unrelatedActionTypes.includes(action.type));

        // not interested in the last action (its from changePinThunk mock);
        actions.pop();

        expect(lockDevice).toHaveBeenNthCalledWith(1, true);
        expect(lockDevice).toHaveBeenNthCalledWith(2, false);
        expect(actions).toMatchObject([
            { type: connectInitThunk.pending.type, payload: undefined },
            { type: connectInitThunk.fulfilled.type, payload: undefined },
            { type: defaultTrezorUIEventHandlerThunk.pending.type },
            { type: UI_EVENTS.BUTTON_REQUEST, payload: { code: 'ButtonRequest_ProtectCall' } },
            {
                type: deviceActions.addButtonRequest.type,
                payload: { buttonRequest: { code: 'ButtonRequest_ProtectCall' }, device },
            },
            { type: defaultTrezorUIEventHandlerThunk.pending.type },
            {
                type: UI_REQUESTS.REQUEST_PIN,
                payload: { type: 'PinMatrixRequestType_NewFirst', device },
            },
            {
                type: deviceActions.addButtonRequest.type,
                payload: { buttonRequest: { code: 'PinMatrixRequestType_NewFirst' }, device },
            },
            { type: deviceActions.removeButtonRequests.type, payload: { device } },
            { type: defaultTrezorUIEventHandlerThunk.fulfilled.type },
            { type: defaultTrezorUIEventHandlerThunk.fulfilled.type },
        ]);
    });
});

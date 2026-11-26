import { type Dispatch, type UnknownAction } from '@reduxjs/toolkit';

import { mockDesktopAnalytics } from '@suite/analytics/mocks';
import {
    type ConnectInitThunkDeps,
    type ConnectInitThunkState,
    connectInitThunk,
} from '@suite-common/connect-init';
import {
    mockConnectInitDeviceEventHooks,
    mockConnectInitSettings,
    mockConnectInitUIEventHooks,
    mockCreateTransports,
    mockGetDebugSettings,
    mockGetThpSettings,
} from '@suite-common/connect-init/mocks';
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
import { mock } from '@trezor/dependency-injection';
import { noopCreateLogger } from '@trezor/logger';

import * as deviceSettingsActions from '#src/actions/settings/deviceSettingsActions';
import buttonRequestMiddleware from '#src/middlewares/suite/buttonRequestMiddleware';
import { prepareSuiteMiddleware } from '#src/middlewares/suite/suiteMiddleware';

const device = mockSuiteDevice();

const getInitialState = (): ConnectInitThunkState => ({
    device: { ...deviceInitialState, devices: [device], selectedDevice: device },
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
            connectInitUIEventHooks: mockConnectInitUIEventHooks(),
            createLogger: noopCreateLogger,
            createTransports: mockCreateTransports(),
            getAllowPrerelease: mockGetAllowPrerelease(),
            getBinFilesBaseUrl: mockGetBinFilesBaseUrl(),
            getDebugSettings: mockGetDebugSettings(),
            getThpSettings: mockGetThpSettings(),
            lockDevice,
        }),
        middleware: [
            prepareSuiteMiddleware(() => ({ services: { suiteSync: mockSuiteSync() } })),
            buttonRequestMiddleware,
        ],
        preloadedState: getInitialState(),
    });

describe('buttonRequest middleware', () => {
    it('see what happens on pin change call', async () => {
        const lockDevice = mock<LockDevice>();
        const { services } = createTestRoot(lockDevice);
        await services.store.dispatch(connectInitThunk());
        const call = services.store.dispatch(
            deviceSettingsActions.changePinThunk({ remove: false }),
        );
        const { emitTestEvent } = testMocks.getTrezorConnectMock();
        // fake few ui events, just like when user is changing PIN
        emitTestEvent(UI_EVENT, {
            type: UI_EVENTS.BUTTON_REQUEST,
            payload: { code: 'ButtonRequest_ProtectCall', device },
        });
        emitTestEvent(UI_REQUEST, {
            type: UI_REQUESTS.REQUEST_PIN,
            payload: { type: 'PinMatrixRequestType_NewFirst', device },
        });

        await call;

        // Not interested in noisy lifecycle actions from reduxJS toolkit
        const unrelatedActionTypes = [
            observeSelectedDeviceThunk.pending.type,
            observeSelectedDeviceThunk.fulfilled.type,
        ];
        const actions = services.store
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
                payload: {
                    buttonRequest: { code: 'ButtonRequest_ProtectCall' },
                    path: device.path,
                },
            },
            { type: defaultTrezorUIEventHandlerThunk.pending.type },
            {
                type: UI_REQUESTS.REQUEST_PIN,
                payload: { type: 'PinMatrixRequestType_NewFirst', device },
            },
            {
                type: deviceActions.addButtonRequest.type,
                payload: {
                    buttonRequest: { code: 'PinMatrixRequestType_NewFirst' },
                    path: device.path,
                },
            },
            { type: defaultTrezorUIEventHandlerThunk.fulfilled.type },
            { type: defaultTrezorUIEventHandlerThunk.fulfilled.type },
            { type: deviceActions.removeButtonRequests.type, payload: { path: device.path } },
        ]);
    });
});

describe('buttonRequest middleware and WARD writes', () => {
    type MiddlewareApi = Parameters<typeof buttonRequestMiddleware>[0];

    const runMiddleware = (name: string) => {
        const dispatched: UnknownAction[] = [];
        const forwarded: UnknownAction[] = [];
        const api: MiddlewareApi = {
            dispatch: action => {
                dispatched.push(action);

                return action;
            },
            getState: mock<MiddlewareApi['getState']>(),
        };
        const next: Dispatch<UnknownAction> = action => {
            forwarded.push(action);

            return action;
        };
        const action = {
            type: UI_EVENTS.BUTTON_REQUEST,
            payload: { code: 'ButtonRequest_ConfirmOutput' as const, name, device },
        };

        buttonRequestMiddleware(api)(next)(action);

        return { dispatched, forwarded, action };
    };

    it.each(['ward_update', 'ward_delete'])(
        'shows the %s confirmation as a plain device confirmation',
        name => {
            const { dispatched, forwarded, action } = runMiddleware(name);

            expect(dispatched).toEqual([
                { ...action, payload: { ...action.payload, code: 'ButtonRequest_Other' } },
            ]);
            expect(forwarded).toEqual([]);
        },
    );

    it('leaves the confirmation of a transaction output as it is', () => {
        const { dispatched, forwarded, action } = runMiddleware('confirm_output');

        expect(dispatched).toEqual([]);
        expect(forwarded).toEqual([action]);
    });
});

import { createAction } from '@reduxjs/toolkit';

import { asGetter } from '@suite-common/dependency-injection';
import { deviceInitialState } from '@suite-common/device';
import { firmwareInitialState } from '@suite-common/firmware';
import { messageSystemInitialState } from '@suite-common/message-system';
import { createMockDispatch } from '@suite-common/redux-utils/mocks';
import { testMocks } from '@suite-common/test-utils';
import {
    defaultTrezorUIEventHandlerThunk,
    initialWalletSettingsState,
    registerScopedCallId,
    unregisterScopedCallId,
} from '@suite-common/wallet-core';
import TrezorConnect, {
    BLOCKCHAIN_EVENT,
    DEVICE,
    DEVICE_EVENT,
    TRANSPORT_EVENT,
    UI_EVENT,
    UI_REQUEST,
} from '@trezor/connect';

import {
    type ConnectInitThunkDeps,
    type ConnectInitThunkDispatch,
    type ConnectInitThunkState,
    connectInitThunk,
} from './connectInitThunks';

type ConnectInitThunkTestDeps = {
    actions: unknown[];
    waitForThunks: () => Promise<void>;
    dispatch: ConnectInitThunkDispatch;
    getState: () => ConnectInitThunkState;
    extra: ConnectInitThunkDeps;
};

const state: ConnectInitThunkState = {
    wallet: { settings: initialWalletSettingsState },
    device: deviceInitialState,
    firmware: firmwareInitialState,
    messageSystem: messageSystemInitialState,
};

const createThunkDeps = (
    services: Partial<ConnectInitThunkDeps['services']> = {},
): ConnectInitThunkTestDeps => {
    const getState = () => state;
    const extra: ConnectInitThunkDeps = {
        actions: {
            lockDevice: createAction<boolean>('@test/lock-device'),
        },
        services: {
            analytics: { report: jest.fn() },
            connectInitHooks: { deviceEvent: {}, uiEvent: {} },
            connectInitSettings: {
                manifest: {
                    email: 'info@trezor.io',
                    appName: 'Trezor Suite',
                    appUrl: '@trezor/suite',
                },
            },
            createTransports: () => [],
            getAllowPrerelease: asGetter(() => false),
            getBinFilesBaseUrl: asGetter(() => '/bin'),
            getDebugSettings: asGetter(() => ({
                transports: [],
                showConnectLogs: false,
            })),
            getThpSettings: asGetter(() => ({ pairingMethods: ['CodeEntry'] })),
            thpHostName: undefined,
            ...services,
        },
    };

    const { actions, dispatch, waitForThunks } = createMockDispatch({ getState, extra });

    return {
        actions,
        waitForThunks,
        dispatch,
        getState,
        extra,
    };
};

describe('TrezorConnect Actions', () => {
    beforeEach(() => {
        testMocks.setTrezorConnectFixtures();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('Success', async () => {
        const { actions, dispatch, getState, extra } = createThunkDeps();

        await connectInitThunk()(dispatch, getState, extra);

        expect(actions).toEqual([
            expect.objectContaining({ type: connectInitThunk.pending.type }),
            expect.objectContaining({ type: connectInitThunk.fulfilled.type }),
        ]);
    });

    it('uses the injected bin files base URL', async () => {
        const getBinFilesBaseUrl = jest.fn(() => '/custom-bin-files');
        const initSpy = jest.spyOn(TrezorConnect, 'init');

        const { dispatch, getState, extra } = createThunkDeps({
            getBinFilesBaseUrl: asGetter(getBinFilesBaseUrl),
        });

        await connectInitThunk()(dispatch, getState, extra);

        expect(getBinFilesBaseUrl).toHaveBeenCalledTimes(1);
        expect(initSpy).toHaveBeenCalledWith(
            expect.objectContaining({ binFilesBaseUrl: '/custom-bin-files' }),
        );
    });

    it('passes the firmware channel from the state to Connect', async () => {
        const initSpy = jest.spyOn(TrezorConnect, 'init');

        const { dispatch, getState, extra } = createThunkDeps();

        await connectInitThunk()(dispatch, getState, extra);

        expect(initSpy).toHaveBeenCalledWith(
            expect.objectContaining({ firmwareChannel: 'production' }),
        );
    });

    it('forces the early access firmware channel for a prerelease-allowing user', async () => {
        const initSpy = jest.spyOn(TrezorConnect, 'init');

        const { dispatch, getState, extra } = createThunkDeps({
            getAllowPrerelease: asGetter(() => true),
        });

        await connectInitThunk()(dispatch, getState, extra);

        expect(initSpy).toHaveBeenCalledWith(
            expect.objectContaining({ firmwareChannel: 'production-early-access' }),
        );
    });

    it('Error', async () => {
        const errorFixture = new Error('Iframe error');
        testMocks.setTrezorConnectFixtures(() => {
            throw errorFixture;
        });

        const { actions, dispatch, getState, extra } = createThunkDeps();

        await connectInitThunk()(dispatch, getState, extra);

        expect(actions).toEqual([
            expect.objectContaining({ type: connectInitThunk.pending.type }),
            expect.objectContaining({
                type: connectInitThunk.rejected.type,
                error: expect.objectContaining({ message: errorFixture.message }),
            }),
        ]);
    });

    it('TypedError', async () => {
        const errorFixture = {
            message: 'Iframe error',
            code: 'SomeCode',
        };
        testMocks.setTrezorConnectFixtures(() => {
            throw errorFixture;
        });

        const { actions, dispatch, getState, extra } = createThunkDeps();

        await connectInitThunk()(dispatch, getState, extra);

        expect(actions).toEqual([
            expect.objectContaining({ type: connectInitThunk.pending.type }),
            expect.objectContaining({
                type: connectInitThunk.rejected.type,
                error: expect.objectContaining({
                    message: `${errorFixture.code}: ${errorFixture.message}`,
                }),
            }),
        ]);
    });

    it('Error as string', async () => {
        const errorFixture = 'Iframe error';
        testMocks.setTrezorConnectFixtures(() => {
            throw errorFixture;
        });

        const { actions, dispatch, getState, extra } = createThunkDeps();

        await connectInitThunk()(dispatch, getState, extra);

        expect(actions).toEqual([
            expect.objectContaining({ type: connectInitThunk.pending.type }),
            expect.objectContaining({
                type: connectInitThunk.rejected.type,
                error: expect.objectContaining({ message: errorFixture }),
            }),
        ]);
    });

    it('Events', async () => {
        const { actions, dispatch, getState, extra } = createThunkDeps();
        const connectInitPromise = connectInitThunk()(dispatch, getState, extra);

        expect(actions).toEqual([expect.objectContaining({ type: connectInitThunk.pending.type })]);

        await connectInitPromise;
        actions.length = 0;
        const { emitTestEvent } = testMocks.getTrezorConnectMock();

        emitTestEvent(DEVICE_EVENT, { type: DEVICE_EVENT });
        expect(actions.at(-1)).toEqual({ type: DEVICE_EVENT });

        emitTestEvent(UI_EVENT, { type: UI_EVENT });
        expect(actions.at(-1)).toEqual({ type: UI_EVENT });

        emitTestEvent(TRANSPORT_EVENT, { type: TRANSPORT_EVENT });
        expect(actions.at(-1)).toEqual({ type: TRANSPORT_EVENT });

        emitTestEvent(BLOCKCHAIN_EVENT, { type: BLOCKCHAIN_EVENT });
        expect(actions.at(-1)).toEqual({ type: BLOCKCHAIN_EVENT });
    });

    it('Wrapped method', async () => {
        const { actions, dispatch, getState, extra } = createThunkDeps();
        await connectInitThunk()(dispatch, getState, extra);
        actions.length = 0;

        await testMocks.getTrezorConnectMock().getFeatures();

        expect(actions).toEqual([
            { type: extra.actions.lockDevice.type, payload: true },
            { type: extra.actions.lockDevice.type, payload: false },
            expect.objectContaining({ type: '@suite/device/removeButtonRequests' }),
        ]);
    });

    it('only scoped callId-bearing UI events are swallowed by the global listener', async () => {
        const { actions, waitForThunks, dispatch, getState, extra } = createThunkDeps();
        await connectInitThunk()(dispatch, getState, extra);
        actions.length = 0;
        const { emitTestEvent } = testMocks.getTrezorConnectMock();
        const scopedCallId = 'scoped-call-id';

        emitTestEvent(UI_EVENT, {
            type: UI_REQUEST.REQUEST_BUTTON,
            payload: { code: 'ButtonRequest_ProtectCall' },
            callId: 'unscoped-call-id',
        });

        registerScopedCallId(scopedCallId);
        try {
            emitTestEvent(UI_EVENT, {
                type: UI_REQUEST.REQUEST_BUTTON,
                payload: { code: 'ButtonRequest_ProtectCall' },
                callId: scopedCallId,
            });

            await waitForThunks();
        } finally {
            unregisterScopedCallId(scopedCallId);
        }

        expect(actions).toEqual([
            expect.objectContaining({ type: defaultTrezorUIEventHandlerThunk.pending.type }),
            expect.objectContaining({ type: UI_REQUEST.REQUEST_BUTTON }),
            expect.objectContaining({ type: '@suite/device/addButtonRequest' }),
            expect.objectContaining({ type: defaultTrezorUIEventHandlerThunk.fulfilled.type }),
        ]);
    });
    it('connectInitHooks.deviceEvent is called for DEVICE.CONNECT / DEVICE.CONNECT_UNACQUIRED', async () => {
        const onConnect = jest.fn();
        const onConnectUnacquired = jest.fn();
        const { dispatch, getState, extra } = createThunkDeps({
            connectInitHooks: {
                deviceEvent: {
                    [DEVICE.CONNECT]: onConnect,
                    [DEVICE.CONNECT_UNACQUIRED]: onConnectUnacquired,
                },
                uiEvent: {},
            },
        });

        await connectInitThunk()(dispatch, getState, extra);
        const { emitTestEvent } = testMocks.getTrezorConnectMock();

        const connectPayload = { path: 'device-1', features: {} };
        emitTestEvent(DEVICE_EVENT, { type: DEVICE.CONNECT, payload: connectPayload });
        const unacquiredPayload = { path: 'device-2' };
        emitTestEvent(DEVICE_EVENT, {
            type: DEVICE.CONNECT_UNACQUIRED,
            payload: unacquiredPayload,
        });

        expect(onConnect).toHaveBeenCalledWith(connectPayload, []);
        expect(onConnectUnacquired).toHaveBeenCalledWith(unacquiredPayload, []);
    });

    it('connectInitHooks.uiEvent is called per action.type forwarded from the global listener', async () => {
        const onInvalidPinDepleted = jest.fn();
        const onRequestWord = jest.fn();
        const { actions, dispatch, getState, extra } = createThunkDeps({
            connectInitHooks: {
                deviceEvent: {},
                uiEvent: {
                    [UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED]: onInvalidPinDepleted,
                    [UI_REQUEST.REQUEST_WORD]: onRequestWord,
                },
            },
        });
        await connectInitThunk()(dispatch, getState, extra);
        actions.length = 0;
        const { emitTestEvent } = testMocks.getTrezorConnectMock();

        emitTestEvent(UI_EVENT, {
            type: UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED,
            payload: {},
        });

        expect(onInvalidPinDepleted).toHaveBeenCalledTimes(1);
        expect(onRequestWord).not.toHaveBeenCalled();

        emitTestEvent(UI_EVENT, { type: UI_REQUEST.REQUEST_WORD, payload: {} });

        expect(onInvalidPinDepleted).toHaveBeenCalledTimes(1);
        expect(onRequestWord).toHaveBeenCalledTimes(1);

        emitTestEvent(UI_EVENT, {
            type: UI_REQUEST.REQUEST_BUTTON,
            payload: { code: 'ButtonRequest_ProtectCall' },
        });

        expect(onInvalidPinDepleted).toHaveBeenCalledTimes(1);
        expect(onRequestWord).toHaveBeenCalledTimes(1);
    });

    // 10s timeout — `__info: true` calls the real Connect implementation through the mock,
    // which spins up an actual Core (init + getFeatures + getAccountInfo + dispose). On
    // busy CI runners this routinely hovers around 4–5s and tripped the 5s default.
    it('Test that connect mock works with __info parameter', async () => {
        const { dispatch, getState, extra } = createThunkDeps();
        await connectInitThunk()(dispatch, getState, extra);

        const res1 = await testMocks.getTrezorConnectMock().getFeatures({ __info: true });
        expect(res1).toMatchObject({
            success: true,
            payload: expect.objectContaining({
                name: 'getFeatures',
                useDevice: true,
            }),
        });

        const res2 = await testMocks.getTrezorConnectMock().getAccountInfo({
            coin: 'btc',
            descriptor: 'xpub6CUGRUonZSQ4TWtTMmzXdrXDtypWKiK9w',
            __info: true,
        });

        expect(res2).toMatchObject({
            success: true,
            payload: expect.objectContaining({
                name: 'getAccountInfo',
                useDevice: false,
            }),
        });
    }, 10_000);
});

import { createAction } from '@reduxjs/toolkit';

import { asGetter, mock } from '@suite-common/dependency-injection';
import { deviceInitialState } from '@suite-common/device';
import { firmwareInitialState } from '@suite-common/firmware';
import { messageSystemInitialState } from '@suite-common/message-system';
import { type MockDispatch, createMockDispatch } from '@suite-common/redux-utils/mocks';
import { testMocks } from '@suite-common/test-utils';
import {
    defaultTrezorUIEventHandlerThunk,
    initialWalletSettingsState,
    registerScopedCallId,
    unregisterScopedCallId,
} from '@suite-common/wallet-core';
import TrezorConnect, {
    BLOCKCHAIN_EVENT,
    DEVICE_EVENT,
    TRANSPORT_EVENT,
    UI_EVENT,
    UI_EVENTS,
    UI_REQUEST,
    UI_REQUESTS,
} from '@trezor/connect';

import {
    type SuiteConnectInitDeps,
    type SuiteConnectInitState,
    createSuiteConnectInit,
} from './createSuiteConnectInit';

type CreateSuiteConnectInitTestDeps = {
    actions: unknown[];
    onDispatch: MockDispatch<SuiteConnectInitState, undefined>['onDispatch'];
    deps: SuiteConnectInitDeps;
};

const state: SuiteConnectInitState = {
    wallet: { settings: initialWalletSettingsState },
    device: deviceInitialState,
    firmware: firmwareInitialState,
    messageSystem: messageSystemInitialState,
};

const createTestDeps = (
    overrides: Partial<SuiteConnectInitDeps> = {},
): CreateSuiteConnectInitTestDeps => {
    const getState = () => state;
    const { actions, dispatch, onDispatch } = createMockDispatch({ getState });
    const deps: SuiteConnectInitDeps = {
        dispatch,
        getState,
        analytics: { report: jest.fn() },
        lockDevice: createAction<boolean>('@test/lock-device'),
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
        trezorUiEventHandler: action => dispatch(defaultTrezorUIEventHandlerThunk(action)),
        ...overrides,
    };

    return { actions, onDispatch, deps };
};

describe('createSuiteConnectInit', () => {
    beforeEach(() => {
        testMocks.setTrezorConnectFixtures();
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('Success', async () => {
        const { deps } = createTestDeps();

        await expect(createSuiteConnectInit(deps)()).resolves.toBeUndefined();
    });

    it('uses the injected bin files base URL', async () => {
        const getBinFilesBaseUrl = jest.fn(() => '/custom-bin-files');
        const initSpy = jest.spyOn(TrezorConnect, 'init');

        const { deps } = createTestDeps({
            getBinFilesBaseUrl: asGetter(getBinFilesBaseUrl),
        });

        await createSuiteConnectInit(deps)();

        expect(getBinFilesBaseUrl).toHaveBeenCalledTimes(1);
        expect(initSpy).toHaveBeenCalledWith(
            expect.objectContaining({ binFilesBaseUrl: '/custom-bin-files' }),
        );
    });

    it('passes the firmware channel from the state to Connect', async () => {
        const initSpy = jest.spyOn(TrezorConnect, 'init');

        const { deps } = createTestDeps();

        await createSuiteConnectInit(deps)();

        expect(initSpy).toHaveBeenCalledWith(
            expect.objectContaining({ firmwareChannel: 'production' }),
        );
    });

    it('forces the early access firmware channel for a prerelease-allowing user', async () => {
        const initSpy = jest.spyOn(TrezorConnect, 'init');

        const { deps } = createTestDeps({
            getAllowPrerelease: asGetter(() => true),
        });

        await createSuiteConnectInit(deps)();

        expect(initSpy).toHaveBeenCalledWith(
            expect.objectContaining({ firmwareChannel: 'production-early-access' }),
        );
    });

    it('Error', async () => {
        const errorFixture = new Error('Iframe error');
        testMocks.setTrezorConnectFixtures(() => {
            throw errorFixture;
        });

        const { deps } = createTestDeps();

        await expect(createSuiteConnectInit(deps)()).rejects.toThrow(errorFixture.message);
    });

    it('TypedError', async () => {
        const errorFixture = {
            message: 'Iframe error',
            code: 'SomeCode',
        };
        testMocks.setTrezorConnectFixtures(() => {
            throw errorFixture;
        });

        const { deps } = createTestDeps();

        await expect(createSuiteConnectInit(deps)()).rejects.toThrow(
            `${errorFixture.code}: ${errorFixture.message}`,
        );
    });

    it('Error as string', async () => {
        const errorFixture = 'Iframe error';
        testMocks.setTrezorConnectFixtures(() => {
            throw errorFixture;
        });

        const { deps } = createTestDeps();

        await expect(createSuiteConnectInit(deps)()).rejects.toThrow(errorFixture);
    });

    it('Events', async () => {
        const { actions, deps } = createTestDeps();
        await createSuiteConnectInit(deps)();
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
        const { actions, deps } = createTestDeps();
        await createSuiteConnectInit(deps)();
        actions.length = 0;

        await testMocks.getTrezorConnectMock().getFeatures();

        expect(actions).toEqual([
            { type: deps.lockDevice.type, payload: true },
            { type: deps.lockDevice.type, payload: false },
            expect.objectContaining({ type: '@suite/device/removeButtonRequests' }),
        ]);
    });

    it('only scoped callId-bearing UI events are swallowed by the global listener', async () => {
        const { actions, onDispatch, deps } = createTestDeps();
        await createSuiteConnectInit(deps)();
        actions.length = 0;
        const { emitTestEvent } = testMocks.getTrezorConnectMock();
        const scopedCallId = 'scoped-call-id';

        // Only the scoped event is swallowed, so the single handler thunk that runs is the one for
        // the unscoped event. Asserting when that thunk reports itself finished is what makes the
        // assertions deterministic, without waiting for anything unrelated.
        const handlerFinished = onDispatch((action, resolve) => {
            if (!defaultTrezorUIEventHandlerThunk.fulfilled.match(action)) return;

            expect(actions).toEqual([
                expect.objectContaining({ type: defaultTrezorUIEventHandlerThunk.pending.type }),
                expect.objectContaining({ type: UI_EVENTS.BUTTON_REQUEST }),
                expect.objectContaining({ type: '@suite/device/addButtonRequest' }),
                expect.objectContaining({ type: defaultTrezorUIEventHandlerThunk.fulfilled.type }),
            ]);
            resolve();
        });

        emitTestEvent(UI_EVENT, {
            type: UI_EVENTS.BUTTON_REQUEST,
            payload: { code: 'ButtonRequest_ProtectCall' },
            callId: 'unscoped-call-id',
        });

        registerScopedCallId(scopedCallId);
        try {
            emitTestEvent(UI_EVENT, {
                type: UI_EVENTS.BUTTON_REQUEST,
                payload: { code: 'ButtonRequest_ProtectCall' },
                callId: scopedCallId,
            });

            await handlerFinished;
        } finally {
            unregisterScopedCallId(scopedCallId);
        }
    });

    it('forwards unscoped UI events and requests to trezorUiEventHandler', async () => {
        const trezorUiEventHandler = mock<SuiteConnectInitDeps['trezorUiEventHandler']>();
        const { deps } = createTestDeps({ trezorUiEventHandler });
        await createSuiteConnectInit(deps)();
        const { emitTestEvent } = testMocks.getTrezorConnectMock();

        emitTestEvent(UI_EVENT, {
            type: UI_EVENTS.PIN_INVALID_ATTEMPTS_DEPLETED,
            payload: {},
        });
        emitTestEvent(UI_REQUEST, { type: UI_REQUESTS.REQUEST_WORD, payload: {} });

        expect(trezorUiEventHandler).toHaveBeenNthCalledWith(1, {
            type: UI_EVENTS.PIN_INVALID_ATTEMPTS_DEPLETED,
            payload: {},
        });
        expect(trezorUiEventHandler).toHaveBeenNthCalledWith(2, {
            type: UI_REQUESTS.REQUEST_WORD,
            payload: {},
        });
    });
});

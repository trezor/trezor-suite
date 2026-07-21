import { messageSystemInitialState } from '@suite-common/message-system';
import {
    configureMockStore,
    extraDependenciesCommonMock,
    testMocks,
} from '@suite-common/test-utils';
import { defaultTrezorUIEventHandlerThunk } from '@suite-common/wallet-core';
import {
    BLOCKCHAIN_EVENT,
    DEVICE,
    DEVICE_EVENT,
    TRANSPORT_EVENT,
    UI_EVENT,
    UI_REQUEST,
} from '@trezor/connect';

import { connectInitThunk } from './connectInitThunks';

describe('TrezorConnect Actions', () => {
    let store = configureMockStore();

    beforeEach(() => {
        store = configureMockStore({
            preloadedState: {
                wallet: { settings: { enabledNetworks: [] } },
                device: { selectedDevice: undefined, devices: [] },
                firmware: { firmwareChannel: 'production' },
                messageSystem: messageSystemInitialState,
            },
        });
    });

    it('Success', async () => {
        await store.dispatch(connectInitThunk());
        const expectedActions = [
            {
                type: connectInitThunk.pending.type,
            },
            {
                type: connectInitThunk.fulfilled.type,
            },
        ];
        expect(
            store.getActions().map(action => ({
                type: action.type,
            })),
        ).toEqual(expectedActions);
    });

    it('Error', async () => {
        const errorFixture = new Error('Iframe error');
        testMocks.setTrezorConnectFixtures(() => {
            throw errorFixture;
        });
        await store.dispatch(connectInitThunk());
        const expectedActions = [
            {
                type: connectInitThunk.pending.type,
            },
            {
                type: connectInitThunk.rejected.type,
                error: errorFixture.message,
            },
        ];
        expect(
            store.getActions().map(action => ({
                type: action.type,
                error: action?.error?.message,
            })),
        ).toEqual(expectedActions);
    });

    it('TypedError', async () => {
        const errorFixture = {
            message: 'Iframe error',
            code: 'SomeCode',
        };
        testMocks.setTrezorConnectFixtures(() => {
            throw errorFixture;
        });
        await store.dispatch(connectInitThunk());
        const expectedActions = [
            {
                type: connectInitThunk.pending.type,
            },
            {
                type: connectInitThunk.rejected.type,
                error: `${errorFixture.code}: ${errorFixture.message}`,
            },
        ];
        expect(
            store.getActions().map(action => ({
                type: action.type,
                error: action?.error?.message,
            })),
        ).toEqual(expectedActions);
    });

    it('Error as string', async () => {
        const errorFixture = 'Iframe error';
        testMocks.setTrezorConnectFixtures(() => {
            throw errorFixture;
        });
        await store.dispatch(connectInitThunk());
        const expectedActions = [
            {
                type: connectInitThunk.pending.type,
            },
            {
                type: connectInitThunk.rejected.type,
                error: errorFixture,
            },
        ];
        expect(
            store.getActions().map(action => ({
                type: action.type,
                error: action?.error?.message,
            })),
        ).toEqual(expectedActions);
    });

    it('Events', () => {
        const defaultSuiteType = process.env.SUITE_TYPE;
        process.env.SUITE_TYPE = 'desktop';
        expect(() => store.dispatch(connectInitThunk())).not.toThrow();

        const actions = store.getActions();
        const { emitTestEvent } = testMocks.getTrezorConnectMock();

        expect(actions.pop()).toMatchObject({ type: connectInitThunk.pending.type });
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
        await store.dispatch(connectInitThunk());
        await testMocks.getTrezorConnectMock().getFeatures();
        const actions = store.getActions();
        // check actions in reversed order
        expect(actions.pop()).toMatchObject({
            type: '@suite/device/removeButtonRequests',
        });
        expect(actions.pop()).toEqual({
            type: extraDependenciesCommonMock.actions.lockDevice.type,
            payload: false,
        });
        expect(actions.pop()).toEqual({
            type: extraDependenciesCommonMock.actions.lockDevice.type,
            payload: true,
        });
    });

    // Characterization test documenting the limitation this stack fixes.
    //
    // A connect call may carry a `callId`: a 3rd-party popup caller supplies its own
    // (public `CommonParams.callId`), and the same field is the cancellation-correlation
    // token Core matches in `abortRunningCall`. Core stamps that `callId` onto every
    // `ui-` event of the call, and the global handler below swallows EVERY callId-bearing
    // event on the assumption that a scoped flow owns it. When no scoped flow does — an
    // external caller, or an ordinary call made cancellable via a `callId` — the event
    // never reaches `defaultTrezorUIEventHandlerThunk`, so the device modal is unreachable
    // and the call hangs. Presence of a `callId` is being used as an ownership signal it
    // cannot actually prove.
    //
    // The follow-up PR replaces this blanket swallow with a scoped-callId registry, so the
    // handler defers only events a scoped flow has explicitly claimed; this test flips to
    // assert that fixed behavior there.
    it('swallows every callId-bearing UI event, leaving an external caller UI unreachable', async () => {
        // Suppress the swallow log; the asserted behavior is the (non-)dispatch, not the warning.
        jest.spyOn(console, 'warn').mockImplementation(() => {});
        await store.dispatch(connectInitThunk());
        const actionsBefore = store.getActions().length;
        const { emitTestEvent } = testMocks.getTrezorConnectMock();

        // No callId -> reaches the global handler and would render.
        emitTestEvent(UI_EVENT, {
            type: UI_REQUEST.REQUEST_BUTTON,
            payload: { code: 'ButtonRequest_ProtectCall' },
        });
        // An external caller's callId -> swallowed, never reaches the handler (the limitation).
        emitTestEvent(UI_EVENT, {
            type: UI_REQUEST.REQUEST_BUTTON,
            payload: { code: 'ButtonRequest_ProtectCall' },
            callId: 'external-caller-call-id',
        });
        await new Promise(resolve => setImmediate(resolve));

        const reachedHandler = store
            .getActions()
            .slice(actionsBefore)
            .filter(a => a.type === defaultTrezorUIEventHandlerThunk.pending.type).length;

        // Only the callId-less event reached the handler; the callId-bearing one was swallowed.
        expect(reachedHandler).toBe(1);
    });

    it('connectInitHooks.deviceEvent is called for DEVICE.CONNECT / DEVICE.CONNECT_UNACQUIRED', async () => {
        const onConnect = jest.fn();
        const onConnectUnacquired = jest.fn();
        const storeWithHooks = configureMockStore({
            preloadedState: {
                wallet: { settings: { enabledNetworks: [] } },
                device: { selectedDevice: undefined, devices: [] },
                firmware: { firmwareChannel: 'production' },
                messageSystem: messageSystemInitialState,
            },
            extra: {
                services: {
                    connectInitHooks: {
                        deviceEvent: {
                            [DEVICE.CONNECT]: onConnect,
                            [DEVICE.CONNECT_UNACQUIRED]: onConnectUnacquired,
                        },
                        uiEvent: {},
                    },
                },
            },
        });

        await storeWithHooks.dispatch(connectInitThunk());
        const { emitTestEvent } = testMocks.getTrezorConnectMock();

        const connectPayload = { path: 'device-1', features: {} };
        emitTestEvent(DEVICE_EVENT, { type: DEVICE.CONNECT, payload: connectPayload });
        const unacquiredPayload = { path: 'device-2' };
        emitTestEvent(DEVICE_EVENT, {
            type: DEVICE.CONNECT_UNACQUIRED,
            payload: unacquiredPayload,
        });

        expect(onConnect).toHaveBeenCalledWith(connectPayload, expect.any(Array));
        expect(onConnectUnacquired).toHaveBeenCalledWith(unacquiredPayload, expect.any(Array));
    });

    it('connectInitHooks.uiEvent is called per action.type forwarded from the global listener', async () => {
        const onInvalidPinDepleted = jest.fn();
        const onRequestWord = jest.fn();
        const storeWithHooks = configureMockStore({
            preloadedState: {
                wallet: { settings: { enabledNetworks: [] } },
                device: { selectedDevice: undefined, devices: [] },
                firmware: { firmwareChannel: 'production' },
                messageSystem: messageSystemInitialState,
            },
            extra: {
                services: {
                    connectInitHooks: {
                        deviceEvent: {},
                        uiEvent: {
                            [UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED]: onInvalidPinDepleted,
                            [UI_REQUEST.REQUEST_WORD]: onRequestWord,
                        },
                    },
                },
            },
        });

        await storeWithHooks.dispatch(connectInitThunk());
        const { emitTestEvent } = testMocks.getTrezorConnectMock();

        emitTestEvent(UI_EVENT, {
            type: UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED,
            payload: {},
        });
        await Promise.resolve();
        emitTestEvent(UI_EVENT, { type: UI_REQUEST.REQUEST_WORD, payload: {} });
        await Promise.resolve();

        expect(onInvalidPinDepleted).toHaveBeenCalledTimes(1);
        expect(onRequestWord).toHaveBeenCalledTimes(1);

        emitTestEvent(UI_EVENT, {
            type: UI_REQUEST.REQUEST_BUTTON,
            payload: { code: 'ButtonRequest_ProtectCall' },
        });
        await Promise.resolve();

        expect(onInvalidPinDepleted).toHaveBeenCalledTimes(1);
        expect(onRequestWord).toHaveBeenCalledTimes(1);
    });

    // 10s timeout — `__info: true` calls the real Connect implementation through the mock,
    // which spins up an actual Core (init + getFeatures + getAccountInfo + dispose). On
    // busy CI runners this routinely hovers around 4–5s and tripped the 5s default.
    it('Test that connect mock works with __info parameter', async () => {
        testMocks.setTrezorConnectFixtures();
        await store.dispatch(connectInitThunk());
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

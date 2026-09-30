import { deviceActions, deviceInitialState } from '@suite-common/device';
import { mockConnectDevice, mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestCompositionRoot } from '@suite-common/test-utils';
import { UI_EVENTS, UI_REQUESTS } from '@trezor/connect';
import { createUiEventMessage, createUiRequestMessage } from '@trezor/connect-common';
import { DeviceModelInternal, FirmwareType } from '@trezor/device-utils';

import {
    type DefaultTrezorUIEventHandlerThunkDeps,
    type DefaultTrezorUIEventHandlerThunkState,
    defaultTrezorUIEventHandlerThunk,
} from './defaultTrezorUIEventHandlerThunk';

const device = mockSuiteDevice();

const requestWordEvent = createUiRequestMessage(
    UI_REQUESTS.REQUEST_WORD,
    {
        device,
        type: 'WordRequestType_Plain',
    },
    { requestId: 'abcd' },
);

const pinDepletedEvent = createUiEventMessage(UI_EVENTS.PIN_INVALID_ATTEMPTS_DEPLETED, {
    device,
});

const firmwareDownloadedEvent = createUiEventMessage(UI_EVENTS.FIRMWARE_DOWNLOADED, {
    binary: new ArrayBuffer(0),
    binaryVersion: [1, 0, 0],
    internalModel: DeviceModelInternal.T2T1,
    release: undefined,
    firmwareType: FirmwareType.Universal,
});

const setupStore = (
    uiEventHooks: Record<string, () => void>,
    preloadedState?: DefaultTrezorUIEventHandlerThunkState,
) =>
    createTestCompositionRoot<
        DefaultTrezorUIEventHandlerThunkDeps,
        DefaultTrezorUIEventHandlerThunkState
    >({
        services: () => ({ connectInitUIEventHooks: uiEventHooks }),
        preloadedState,
    }).services.store;

describe('defaultTrezorUIEventHandlerThunk - connectInitUIEventHooks', () => {
    it('calls the hook registered for the dispatched event type and still dispatches the event', async () => {
        const requestWordHook = jest.fn();
        const store = setupStore({ [UI_REQUESTS.REQUEST_WORD]: requestWordHook });

        await store.dispatch(defaultTrezorUIEventHandlerThunk(requestWordEvent));

        expect(requestWordHook).toHaveBeenCalledTimes(1);
        expect(store.getActions()).toContainEqual(
            expect.objectContaining({ type: UI_REQUESTS.REQUEST_WORD }),
        );
    });

    it('calls only the hook matching the dispatched event type', async () => {
        const requestWordHook = jest.fn();
        const pinDepletedHook = jest.fn();
        const store = setupStore({
            [UI_REQUESTS.REQUEST_WORD]: requestWordHook,
            [UI_EVENTS.PIN_INVALID_ATTEMPTS_DEPLETED]: pinDepletedHook,
        });

        await store.dispatch(defaultTrezorUIEventHandlerThunk(pinDepletedEvent));

        expect(pinDepletedHook).toHaveBeenCalledTimes(1);
        expect(requestWordHook).not.toHaveBeenCalled();
    });

    it('ignores FIRMWARE_DOWNLOADED completely: the event is dropped and no hook runs', async () => {
        const firmwareHook = jest.fn();
        const store = setupStore({ [UI_EVENTS.FIRMWARE_DOWNLOADED]: firmwareHook });

        await store.dispatch(defaultTrezorUIEventHandlerThunk(firmwareDownloadedEvent));

        expect(firmwareHook).not.toHaveBeenCalled();
        expect(store.getActions()).not.toContainEqual(
            expect.objectContaining({ type: UI_EVENTS.FIRMWARE_DOWNLOADED }),
        );
    });

    it('does not throw when no hook is registered for the dispatched event type', async () => {
        const store = setupStore({});

        await expect(
            store.dispatch(defaultTrezorUIEventHandlerThunk(requestWordEvent)),
        ).resolves.toBeDefined();
    });
});

describe('defaultTrezorUIEventHandlerThunk - button request attribution', () => {
    const deviceA = mockSuiteDevice({ id: 'device-a', path: 'path-a' });
    const deviceB = mockSuiteDevice({ id: 'device-b', path: 'path-b' });
    const connectDeviceA = mockConnectDevice({ id: 'device-a', path: 'path-a' });
    const connectDeviceB = mockConnectDevice({ id: 'device-b', path: 'path-b' });

    const createState = (selectedDevice = deviceA): DefaultTrezorUIEventHandlerThunkState => ({
        device: { ...deviceInitialState, devices: [deviceA, deviceB], selectedDevice },
    });

    const selectAddButtonRequestActions = (store: ReturnType<typeof setupStore>) =>
        store.getActions().filter(deviceActions.addButtonRequest.match);

    it('attaches a button request to the event device when another device is selected', async () => {
        const store = setupStore({}, createState(deviceB));

        await store.dispatch(
            defaultTrezorUIEventHandlerThunk(
                createUiEventMessage(UI_EVENTS.BUTTON_REQUEST, {
                    code: 'ButtonRequest_ProtectCall',
                    device: connectDeviceA,
                }),
            ),
        );

        expect(selectAddButtonRequestActions(store)).toEqual([
            deviceActions.addButtonRequest({
                device: deviceA,
                buttonRequest: { code: 'ButtonRequest_ProtectCall' },
            }),
        ]);
    });

    it('attaches a PIN request to the event device when another device is selected', async () => {
        const store = setupStore({}, createState(deviceB));

        await store.dispatch(
            defaultTrezorUIEventHandlerThunk(
                createUiRequestMessage(
                    UI_REQUESTS.REQUEST_PIN,
                    { device: connectDeviceA, type: 'PinMatrixRequestType_Current' },
                    { requestId: 'pin-request' },
                ),
            ),
        );

        expect(selectAddButtonRequestActions(store)).toEqual([
            deviceActions.addButtonRequest({
                device: deviceA,
                buttonRequest: { code: 'PinMatrixRequestType_Current' },
            }),
        ]);
    });

    it('attaches concurrent requests of two devices to their own device', async () => {
        const store = setupStore({}, createState(deviceA));

        await Promise.all([
            store.dispatch(
                defaultTrezorUIEventHandlerThunk(
                    createUiEventMessage(UI_EVENTS.BUTTON_REQUEST, {
                        code: 'ButtonRequest_ProtectCall',
                        device: connectDeviceA,
                    }),
                ),
            ),
            store.dispatch(
                defaultTrezorUIEventHandlerThunk(
                    createUiEventMessage(UI_EVENTS.PIN_INVALID, { device: connectDeviceB }),
                ),
            ),
        ]);

        expect(selectAddButtonRequestActions(store)).toEqual([
            deviceActions.addButtonRequest({
                device: deviceA,
                buttonRequest: { code: 'ButtonRequest_ProtectCall' },
            }),
            deviceActions.addButtonRequest({
                device: deviceB,
                buttonRequest: { code: UI_EVENTS.PIN_INVALID },
            }),
        ]);
    });

    it('does not attach a button request when the event device is unknown', async () => {
        const store = setupStore({}, createState(deviceA));

        await store.dispatch(
            defaultTrezorUIEventHandlerThunk(
                createUiEventMessage(UI_EVENTS.BUTTON_REQUEST, {
                    code: 'ButtonRequest_ProtectCall',
                    device: mockConnectDevice({ id: 'device-c', path: 'path-c' }),
                }),
            ),
        );

        expect(selectAddButtonRequestActions(store)).toEqual([]);
        expect(store.getActions()).toContainEqual(
            expect.objectContaining({ type: UI_EVENTS.BUTTON_REQUEST }),
        );
    });
});

import { deviceActions } from '@suite-common/device';
import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { configureMockStore } from '@suite-common/test-utils';
import { UI_REQUEST, asDeviceUniquePath } from '@trezor/connect';
import { createUiMessage } from '@trezor/connect-common';
import { DeviceModelInternal, FirmwareType } from '@trezor/device-utils';

import { defaultTrezorUIEventHandlerThunk } from './defaultTrezorUIEventHandlerThunk';

const device = mockSuiteDevice();

const requestWordEvent = createUiMessage(UI_REQUEST.REQUEST_WORD, {
    device,
    type: 'WordRequestType_Plain',
});

const pinDepletedEvent = createUiMessage(UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED, {
    device,
});

const firmwareDownloadedEvent = createUiMessage(UI_REQUEST.FIRMWARE_DOWNLOADED, {
    binary: new ArrayBuffer(0),
    binaryVersion: [1, 0, 0],
    internalModel: DeviceModelInternal.T2T1,
    release: undefined,
    firmwareType: FirmwareType.Universal,
});

const setupStore = (uiEventHooks: Record<string, () => void>) =>
    configureMockStore({
        extra: { services: { connectInitHooks: { deviceEvent: {}, uiEvent: uiEventHooks } } },
    });

describe('defaultTrezorUIEventHandlerThunk - connectInitHooks.uiEvent', () => {
    it('calls the hook registered for the dispatched event type and still dispatches the event', async () => {
        const requestWordHook = jest.fn();
        const store = setupStore({ [UI_REQUEST.REQUEST_WORD]: requestWordHook });

        await store.dispatch(defaultTrezorUIEventHandlerThunk(requestWordEvent));

        expect(requestWordHook).toHaveBeenCalledTimes(1);
        expect(store.getActions()).toContainEqual(
            expect.objectContaining({ type: UI_REQUEST.REQUEST_WORD }),
        );
    });

    it('calls only the hook matching the dispatched event type', async () => {
        const requestWordHook = jest.fn();
        const pinDepletedHook = jest.fn();
        const store = setupStore({
            [UI_REQUEST.REQUEST_WORD]: requestWordHook,
            [UI_REQUEST.INVALID_PIN_ATTEMPTS_DEPLETED]: pinDepletedHook,
        });

        await store.dispatch(defaultTrezorUIEventHandlerThunk(pinDepletedEvent));

        expect(pinDepletedHook).toHaveBeenCalledTimes(1);
        expect(requestWordHook).not.toHaveBeenCalled();
    });

    it('ignores FIRMWARE_DOWNLOADED completely: the event is dropped and no hook runs', async () => {
        const firmwareHook = jest.fn();
        const store = setupStore({ [UI_REQUEST.FIRMWARE_DOWNLOADED]: firmwareHook });

        await store.dispatch(defaultTrezorUIEventHandlerThunk(firmwareDownloadedEvent));

        expect(firmwareHook).not.toHaveBeenCalled();
        expect(store.getActions()).not.toContainEqual(
            expect.objectContaining({ type: UI_REQUEST.FIRMWARE_DOWNLOADED }),
        );
    });

    it('does not throw when no hook is registered for the dispatched event type', async () => {
        const store = setupStore({});

        await expect(
            store.dispatch(defaultTrezorUIEventHandlerThunk(requestWordEvent)),
        ).resolves.toBeDefined();
    });
});

describe('defaultTrezorUIEventHandlerThunk - button request path keying', () => {
    // A button request is a prompt on the PHYSICAL device; it must be keyed by the device's own
    // `path` from the event, never the currently selected device (which may be a different one).
    const pathA = asDeviceUniquePath('path-A');
    const deviceA = mockSuiteDevice({ path: pathA });

    it('keys a REQUEST_BUTTON by the event device path, independent of the selected device', async () => {
        const store = setupStore({});

        await store.dispatch(
            defaultTrezorUIEventHandlerThunk(
                createUiMessage(UI_REQUEST.REQUEST_BUTTON, {
                    device: deviceA,
                    code: 'ButtonRequest_SignTx',
                }),
            ),
        );

        expect(store.getActions()).toContainEqual(
            deviceActions.addButtonRequest({
                path: pathA,
                buttonRequest: { code: 'ButtonRequest_SignTx' },
            }),
        );
    });

    it('keys a REQUEST_PIN by the event device path', async () => {
        const store = setupStore({});

        await store.dispatch(
            defaultTrezorUIEventHandlerThunk(
                createUiMessage(UI_REQUEST.REQUEST_PIN, {
                    device: deviceA,
                    type: 'PinMatrixRequestType_Current',
                }),
            ),
        );

        expect(store.getActions()).toContainEqual(
            deviceActions.addButtonRequest({
                path: pathA,
                buttonRequest: { code: 'PinMatrixRequestType_Current' },
            }),
        );
    });
});

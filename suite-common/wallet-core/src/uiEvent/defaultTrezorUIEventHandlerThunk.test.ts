import { mockSuiteDevice } from '@suite-common/suite-types/mocks';
import { createTestStore } from '@suite-common/test-utils';
import { UI_EVENTS, UI_REQUESTS } from '@trezor/connect';
import { createUiEventMessage, createUiRequestMessage } from '@trezor/connect-common';
import { DeviceModelInternal, FirmwareType } from '@trezor/device-utils';

import { defaultTrezorUIEventHandlerThunk } from './defaultTrezorUIEventHandlerThunk';

const device = mockSuiteDevice();

const requestWordEvent = createUiRequestMessage(
    UI_REQUESTS.REQUEST_WORD,
    {
        device,
        type: 'WordRequestType_Plain',
    },
    { requestId: 'abcd' },
);

const firmwareDownloadedEvent = createUiEventMessage(UI_EVENTS.FIRMWARE_DOWNLOADED, {
    binary: new ArrayBuffer(0),
    binaryVersion: [1, 0, 0],
    internalModel: DeviceModelInternal.T2T1,
    release: undefined,
    firmwareType: FirmwareType.Universal,
});

const setupStore = () => createTestStore({ extra: undefined });

describe('defaultTrezorUIEventHandlerThunk', () => {
    it('dispatches the event', async () => {
        const store = setupStore();

        await store.dispatch(defaultTrezorUIEventHandlerThunk(requestWordEvent));

        expect(store.getActions()).toContainEqual(
            expect.objectContaining({ type: UI_REQUESTS.REQUEST_WORD }),
        );
    });

    it('ignores FIRMWARE_DOWNLOADED completely', async () => {
        const store = setupStore();

        await store.dispatch(defaultTrezorUIEventHandlerThunk(firmwareDownloadedEvent));

        expect(store.getActions()).not.toContainEqual(
            expect.objectContaining({ type: UI_EVENTS.FIRMWARE_DOWNLOADED }),
        );
    });
});

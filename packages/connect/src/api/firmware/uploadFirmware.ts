// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/uploadFirmware.js

import { TRANSPORT } from '@trezor/transport';

import { ERRORS, PROTO } from '../../constants';
import type { Device } from '../../device/Device';
import type { TypedCall } from '../../device/DeviceCommands';
import { CoreEventMessage, DEVICE, UI, createUiMessage } from '../../events';

// firmware does not send button message but user still must press button to continue
// with fw update.
const postConfirmationMessage = (device: Device) => {
    // only if firmware is already installed. fresh device does not require button confirmation
    if (device.features.firmware_present) {
        device.emit(DEVICE.BUTTON, { device, payload: { code: 'ButtonRequest_FirmwareUpdate' } });
    }
};

const postProgressMessage = (
    device: Device,
    progress: number,
    postMessage: (message: CoreEventMessage) => void,
) => {
    postMessage(
        createUiMessage(UI.FIRMWARE_PROGRESS, {
            device: device.toMessageObject(),
            operation: 'flashing',
            progress,
        }),
    );
};

const FIRMWARE_ERASE_TIMEOUT_MILLISECONDS = 15_000;

export const uploadFirmware = async (
    typedCall: TypedCall,
    postMessage: (message: CoreEventMessage) => void,
    device: Device,
    { payload }: PROTO.FirmwareUpload,
) => {
    if (device.features.major_version === 1) {
        postConfirmationMessage(device);

        // If FirmwareErase takes too long, it can be simply because we're waiting for the user pressing the confirm button,
        // but it may also indicate that something is wrong with the device, so inform Suite which can then display warning.
        // this may be removed in future if we confirm that the issue was resolved
        const timeoutId = setTimeout(() => {
            postMessage(createUiMessage(UI.FIRMWARE_PROGRESS_UNEXPECTED_DELAY, {}));
        }, FIRMWARE_ERASE_TIMEOUT_MILLISECONDS);
        await typedCall('FirmwareErase', 'Success', {});
        clearTimeout(timeoutId);

        postProgressMessage(device, 0, postMessage);

        let i = 0;
        const progressTimer = setInterval(() => {
            i++;
            postProgressMessage(device, Math.min(i * 2, 99), postMessage);
        }, 300);

        const message = await typedCall('FirmwareUpload', 'Success', {
            payload,
        }).finally(() => {
            clearInterval(progressTimer);
        });

        postProgressMessage(device, 100, postMessage);

        return message;
    }

    if (device.features.major_version === 2) {
        postConfirmationMessage(device);
        const length = payload.byteLength;
        let progress = 0;
        let response = await typedCall('FirmwareErase', ['FirmwareRequest', 'Success'], { length });
        while (response.type !== 'Success') {
            // NOTE: offset and message are present in T2
            const start = response.message.offset;
            const end = response.message.offset + response.message.length;
            const chunk = payload.slice(start, end);
            const progressStart = Math.round((start / length) * 100);
            const progressEnd = Math.round((end / length) * 100);
            const progressDiff = progressEnd - progressStart;
            device.transport.on(TRANSPORT.SEND_MESSAGE_PROGRESS, p => {
                const newProgress = progressStart + Math.floor(progressDiff * p);
                if (start > 0 && newProgress > progress) {
                    progress = newProgress;
                    postProgressMessage(device, progress, postMessage);
                }
            });

            // in this moment, device is still displaying 'update firmware dialog', no firmware process is in progress yet
            if (start > 0) {
                postProgressMessage(device, progressStart, postMessage);
            }
            response = await typedCall('FirmwareUpload', ['FirmwareRequest', 'Success'], {
                payload: chunk,
            }).finally(() => {
                device.transport.removeAllListeners(TRANSPORT.SEND_MESSAGE_PROGRESS);
            });
        }
        postProgressMessage(device, 100, postMessage);

        return response.message;
    }

    throw ERRORS.TypedError('Runtime', 'uploadFirmware: unknown major_version');
};

// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/uploadFirmware.js

import { UI, DEVICE, createUiMessage, CoreEventMessage } from '../../events';
import { PROTO, ERRORS } from '../../constants';
import type { Device } from '../../device/Device';
import type { TypedCall } from '../../device/DeviceCommands';

// firmware does not send button message but user still must press button to continue
// with fw update.
const postConfirmationMessage = (device: Device) => {
    // only if firmware is already installed. fresh device does not require button confirmation
    if (device.features.firmware_present) {
        device.emit(DEVICE.BUTTON, device, { code: 'ButtonRequest_FirmwareUpdate' });
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
            progress,
        }),
    );
};

export const uploadFirmware = async (
    typedCall: TypedCall,
    postMessage: (message: CoreEventMessage) => void,
    device: Device,
    { payload }: PROTO.FirmwareUpload,
) => {
    if (device.features.major_version === 1) {
        postConfirmationMessage(device);
        await typedCall('FirmwareErase', 'Success', {});
        postProgressMessage(device, 0, postMessage);
        const { message } = await typedCall('FirmwareUpload', 'Success', {
            payload,
        });
        postProgressMessage(device, 100, postMessage);

        return message;
    }

    if (device.features.major_version === 2) {
        postConfirmationMessage(device);
        const length = payload.byteLength;
        let response = await typedCall('FirmwareErase', ['FirmwareRequest', 'Success'], { length });
        while (response.type !== 'Success') {
            // NOTE: offset and message are present in T2
            const start = response.message.offset!;
            const end = response.message.offset! + response.message.length!;
            const chunk = payload.slice(start, end);
            // in this moment, device is still displaying 'update firmware dialog', no firmware process is in progress yet
            if (start > 0) {
                postProgressMessage(device, Math.round((start / length) * 100), postMessage);
            }
            response = await typedCall('FirmwareUpload', ['FirmwareRequest', 'Success'], {
                payload: chunk,
            });
        }
        postProgressMessage(device, 100, postMessage);

        return response.message;
    }

    throw ERRORS.TypedError('Runtime', 'uploadFirmware: unknown major_version');
};

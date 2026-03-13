// origin: https://github.com/trezor/connect/blob/develop/src/js/core/methods/helpers/uploadFirmware.js

import { ERRORS } from '@trezor/connect-common/src/constants';
import { getFirmwareVersionArray } from '@trezor/device-utils';
import { TRANSPORT } from '@trezor/transport';
import { isWithinRange } from '@trezor/utils/src/versionUtils';

import type { PROTO } from '../../constants';
import type { TypedCall } from '../../device/DeviceCommands';
import type { CoreEventMessage } from '../../events';
import { DEVICE, UI_REQUEST, createUiMessage } from '../../events';
import type { FirmwareUpdateFlowType } from '../../types';
import type { IDevice } from '../../types/idevice';

// Each FW update flow starts with confirmation to restart into bootloader, and in some cases a confirmation for the FW
// update itself. But device sends no ButtonRequest at that point, so create a synthethic ButtonRequest.
const postConfirmationMessage = (device: IDevice, updateFlowType: FirmwareUpdateFlowType) => {
    // Device does not require confirmation if fresh install, or if the flow is 'reboot_and_upgrade'.
    const freshInstall = device.features.firmware_present === false;
    if (freshInstall || updateFlowType === 'reboot_and_upgrade') return;

    device.emit(DEVICE.BUTTON, { device, payload: { code: 'ButtonRequest_FirmwareUpdate' } });
};

const postProgressMessage = (
    device: IDevice,
    progress: number,
    postMessage: (message: CoreEventMessage) => void,
) => {
    postMessage(
        createUiMessage(UI_REQUEST.FIRMWARE_PROGRESS, {
            device: device.toMessageObject(),
            operation: 'flashing',
            progress,
        }),
    );
};

const FIRMWARE_ERASE_TIMEOUT_MILLISECONDS = 15_000;
const TIMEOUT_MIN_FW_VERSION = '1.12.1';
const TIMEOUT_MAX_FW_VERSION = '1.13.0';

type UploadFirmwareProps = {
    typedCall: TypedCall;
    postMessage: (message: CoreEventMessage) => void;
    device: IDevice;
    firmwareUploadRequest: PROTO.FirmwareUpload;
    updateFlowType: FirmwareUpdateFlowType;
};

export const uploadFirmware = async ({
    typedCall,
    postMessage,
    device,
    firmwareUploadRequest: { payload },
    updateFlowType,
}: UploadFirmwareProps) => {
    if (device.features.major_version === 1) {
        postConfirmationMessage(device, updateFlowType);

        // If FirmwareErase takes too long, it can be simply because we're waiting for the user pressing the confirm button,
        // but it may also indicate that something is wrong with the device, so inform Suite which can then display warning.
        // this may be removed in future if we confirm that the issue was resolved
        const timeoutId = setTimeout(() => {
            const version = getFirmwareVersionArray(device.toMessageObject());
            if (version === null) return;
            if (isWithinRange(version, TIMEOUT_MIN_FW_VERSION, TIMEOUT_MAX_FW_VERSION)) {
                postMessage(createUiMessage(UI_REQUEST.FIRMWARE_PROGRESS_UNEXPECTED_DELAY, {}));
            }
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
        postConfirmationMessage(device, updateFlowType);
        const length = payload.byteLength;
        let progress = 0;
        let response = await typedCall('FirmwareErase', ['FirmwareRequest', 'Success'], { length });
        // We are starting the flashing process.
        postMessage(
            createUiMessage(UI_REQUEST.FIRMWARE_PROGRESS, {
                device: device.toMessageObject(),
                operation: 'start-flashing',
                progress,
            }),
        );
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

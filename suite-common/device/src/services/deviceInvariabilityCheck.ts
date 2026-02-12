import type { PersistentDeviceData } from '@suite-common/suite-types';
import { isDeviceKnown as getIsDeviceKnown } from '@suite-common/suite-utils';
import type { Device, Features } from '@trezor/connect';
import { type Result, err, ok } from '@trezor/type-utils';

type DeviceInvariabilityCheckError = {
    currentModel?: Features['internal_model'];
    previousModel?: Features['internal_model'];
    currentColor?: Features['unit_color'];
    previousColor?: Features['unit_color'];
};

type DeviceInvariabilityCheckDTO = {
    isDeviceKnown: boolean;
    isBootloaderMode: boolean;
    currentModel?: Features['internal_model'];
    currentColor?: Features['unit_color'];
    hasPreviousRecord?: boolean;
    previousModel?: PersistentDeviceData['internal_model'];
    previousColor?: PersistentDeviceData['unit_color'];
};

// Compares an incoming device with its previous data to check invariability of certain properties.
export const deviceInvariabilityCheck = ({
    isDeviceKnown,
    isBootloaderMode,
    currentModel,
    currentColor,
    hasPreviousRecord,
    previousModel,
    previousColor,
}: DeviceInvariabilityCheckDTO): Result<void, DeviceInvariabilityCheckError> => {
    if (
        // no previous data to compare against (first time occurrence of this device id)
        !hasPreviousRecord ||
        // skip when unacquired or bootloader mode (device will become acquired & normal mode later)
        !isDeviceKnown ||
        isBootloaderMode
    ) {
        return ok();
    }

    const isModelMismatch = currentModel !== previousModel;
    const isColorMismatch = currentColor !== previousColor;

    if (isModelMismatch || isColorMismatch) {
        const error: DeviceInvariabilityCheckError = {
            ...(isModelMismatch ? { previousModel, currentModel } : {}),
            ...(isColorMismatch ? { previousColor, currentColor } : {}),
        };

        return err(error);
    }

    return ok();
};

type RawData = {
    device?: Device;
    previousData?: PersistentDeviceData;
};

export const rawDataToDeviceInvariabilityCheckDTO = ({
    device,
    previousData,
}: RawData): DeviceInvariabilityCheckDTO => ({
    isDeviceKnown: getIsDeviceKnown(device),
    isBootloaderMode: device?.features?.bootloader_mode === true,
    currentModel: device?.features?.internal_model,
    currentColor: device?.features?.unit_color,
    hasPreviousRecord: previousData !== undefined,
    previousModel: previousData?.internal_model,
    previousColor: previousData?.unit_color,
});

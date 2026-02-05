import type { PersistentDeviceData } from '@suite-common/suite-types';
import { isDeviceKnown } from '@suite-common/suite-utils';
import type { Device, Features } from '@trezor/connect';
import { type Result, err, ok } from '@trezor/type-utils';

type DeviceInvariabilityCheckError = {
    currentModel?: Features['internal_model'];
    previousModel?: Features['internal_model'];
    currentColor?: Features['unit_color'];
    previousColor?: Features['unit_color'];
};

type DeviceInvariabilityCheckParams = {
    device?: Device;
    previousData?: PersistentDeviceData;
};

// Compares an incoming device with its previous data to check invariability of certain properties.
export const deviceInvariabilityCheck = ({
    device,
    previousData,
}: DeviceInvariabilityCheckParams): Result<void, DeviceInvariabilityCheckError> => {
    if (
        // no device, no problem
        !device ||
        // no previous data to compare against (first time occurrence of this device id)
        !previousData ||
        // skip when unacquired or bootloader mode (device will become acquired & normal mode later)
        !isDeviceKnown(device) ||
        device.features.bootloader_mode === true
    ) {
        return ok();
    }

    const currentModel = device.features.internal_model;
    const previousModel = previousData.internal_model;
    const currentColor = device.features.unit_color;
    const previousColor = previousData.unit_color;
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

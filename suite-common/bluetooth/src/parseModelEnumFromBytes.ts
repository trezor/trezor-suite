import { DeviceModelInternal } from '@trezor/device-utils';

export const parseModelEnumFromBytes = (data: number[]): DeviceModelInternal => {
    if (data.length < 6) {
        return DeviceModelInternal.UNKNOWN;
    }

    const bytes = data.slice(2, 6).reverse();
    if (bytes.length !== 4) {
        return DeviceModelInternal.UNKNOWN;
    }

    const model = String.fromCharCode(...bytes) as DeviceModelInternal;

    if (!DeviceModelInternal[model]) {
        return DeviceModelInternal.UNKNOWN;
    }

    return model;
};

import React from 'react';
import { TrezorDevice } from '@suite-types';
import { Image, ImageProps } from '@trezor/components';
import { getDeviceModel } from '@trezor/device-utils';

interface DeviceConfirmImageProps extends Omit<ImageProps, 'image'> {
    device: TrezorDevice;
}

export const DeviceConfirmImage = ({ device, ...rest }: DeviceConfirmImageProps) => {
    const deviceModel = getDeviceModel(device);

    if (!deviceModel) {
        return null;
    }

    const imgName = `DEVICE_CONFIRM_TREZOR_T${deviceModel}` as const;

    return <Image {...rest} image={imgName} />;
};

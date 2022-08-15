import React from 'react';
import { TrezorDevice } from '@suite-types';
import { Image, ImageProps } from '@trezor/components';
import { ImageType } from '@trezor/components/src/components/Image/Image';
import { getDeviceModel } from '@suite-utils/device';

const getImage = (majorVersion: '1' | 'T'): ImageType => {
    switch (majorVersion) {
        case '1':
            return 'ONE_DEVICE_CONFIRM';
        case 'T':
            return 'T_DEVICE_CONFIRM';
        default:
            return 'T_DEVICE_CONFIRM';
    }
};

interface DeviceConfirmImageProps extends Omit<ImageProps, 'image'> {
    device: TrezorDevice;
}

export const DeviceConfirmImage = ({ device, ...rest }: DeviceConfirmImageProps) => {
    const majorVersion = getDeviceModel(device);

    const imgName = getImage(majorVersion);

    return <Image {...rest} image={imgName} />;
};

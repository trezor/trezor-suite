import React from 'react';
import { TrezorDevice } from '@suite-types';
import { Image, ImageProps } from '..';
import { ImageType } from './Image';

const getImage = (majorVersion: number): ImageType => {
    switch (majorVersion) {
        case 1:
            return 'ONE_DEVICE_CONFIRM';
        case 2:
            return 'T_DEVICE_CONFIRM';
        default:
            return 'T_DEVICE_CONFIRM';
    }
};

interface DeviceConfirmImageProps extends Omit<ImageProps, 'image'> {
    device: TrezorDevice;
}

export const DeviceConfirmImage = ({ device, ...rest }: DeviceConfirmImageProps) => {
    const majorVersion = device.features ? device.features.major_version : 2;

    const imgName = getImage(majorVersion);

    return <Image {...rest} image={imgName} />;
};

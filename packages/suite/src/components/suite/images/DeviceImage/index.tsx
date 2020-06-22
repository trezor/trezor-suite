import React from 'react';
import { TrezorDevice } from '@suite-types';
import { resolveStaticPath } from '@suite-utils/nextjs';

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
    device: TrezorDevice;
}

const getDeviceImage = (majorVersion: number) => {
    switch (majorVersion) {
        case 1:
            return 'T1';
        case 2:
            return 'T2';
        default:
            return 'TUnknown';
    }
};

const DeviceImage = ({ device, ...rest }: Props) => {
    const majorVersion = device.features?.major_version ?? 2;
    const image = getDeviceImage(majorVersion);
    return <img alt="trezor" src={resolveStaticPath(`images/png/trezor/${image}.png`)} {...rest} />;
};

export default DeviceImage;

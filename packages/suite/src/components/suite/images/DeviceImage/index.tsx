import React from 'react';
import { TrezorDevice } from '@suite-types';
import { resolveStaticPath } from '@suite-utils/nextjs';
import styled from 'styled-components';

interface Props extends React.HTMLAttributes<HTMLImageElement> {
    device: TrezorDevice;
}

const getDeviceImage = (majorVersion: number) => {
    switch (majorVersion) {
        case 1:
            return 'T1';
        case 2:
            return 'T2';
        default:
            return 'T2';
    }
};

const Img = styled.img``;

const DeviceImage = ({ device, ...rest }: Props) => {
    const majorVersion = device.features?.major_version ?? 2;
    const image = getDeviceImage(majorVersion);
    return <Img src={resolveStaticPath(`images/suite/${image}.svg`)} {...rest} />;
};

export default DeviceImage;

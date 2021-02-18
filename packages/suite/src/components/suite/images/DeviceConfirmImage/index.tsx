import React from 'react';
import { TrezorDevice } from '@suite-types';
import { resolveStaticPath } from '@suite-utils/build';
import styled, { css } from 'styled-components';

const Image = styled.img`
    ${props =>
        props.theme.IMAGE_FILTER &&
        css`
            filter: ${props.theme.IMAGE_FILTER};
        `}
`;

interface Props extends React.HTMLAttributes<HTMLImageElement> {
    device: TrezorDevice;
}

const getImage = (majorVersion: number) => {
    switch (majorVersion) {
        case 1:
            return 'one-device-confirm';
        case 2:
            return 't-device-confirm';
        default:
            return 't-device-confirm';
    }
};

const DeviceConfirmImage = ({ device, ...rest }: Props) => {
    const majorVersion = device.features ? device.features.major_version : 2;
    const imgName = getImage(majorVersion);
    return <Image src={resolveStaticPath(`images/svg/${imgName}.svg`)} {...rest} />;
};

export default DeviceConfirmImage;

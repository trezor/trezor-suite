import React from 'react';
import { DeviceAnimation } from '../animations/DeviceAnimation';
import { DeviceModelInternal } from '@trezor/connect';
import { Image } from '../Image/Image';
import styled from 'styled-components';

export type RotateDeviceImageProps = {
    deviceModel?: DeviceModelInternal;
    deviceColor?: number;
    className?: string;
    animationHeight?: string;
    animationWidth?: string;
};

const StyledImage = styled(Image)`
    /* do not apply the darkening filter in dark mode on device images */
    filter: none;
`;

export const RotateDeviceImage = ({
    deviceModel,
    deviceColor,
    className,
    animationHeight,
    animationWidth,
}: RotateDeviceImageProps) => {
    if (!deviceModel) {
        return null;
    }

    const isDeviceImageRotating =
        deviceModel && [DeviceModelInternal.T3T1, DeviceModelInternal.T2B1].includes(deviceModel);

    return (
        <>
            {isDeviceImageRotating ? (
                <DeviceAnimation
                    className={className}
                    type="ROTATE"
                    deviceModelInternal={deviceModel}
                    deviceUnitColor={deviceColor}
                    height={animationHeight}
                    width={animationWidth}
                />
            ) : (
                <StyledImage alt="Trezor" image={`TREZOR_${deviceModel}`} className={className} />
            )}
        </>
    );
};

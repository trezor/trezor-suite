import React from 'react';

import { DeviceModelInternal } from '@trezor/device-utils';

import { DeviceAnimation } from '../DeviceAnimation/DeviceAnimation';

export type RotateDeviceImageProps = {
    deviceModel?: DeviceModelInternal;
    deviceColor?: number;
    className?: string;
    loop?: boolean;
    animationHeight?: string;
    animationWidth?: string;
};

export const RotateDeviceImage = ({
    deviceModel,
    deviceColor,
    className,
    loop,
    animationHeight,
    animationWidth,
}: RotateDeviceImageProps) => {
    if (!deviceModel) {
        return null;
    }

    return (
        <DeviceAnimation
            loop={loop}
            className={className}
            type="ROTATE"
            deviceModelInternal={deviceModel}
            deviceUnitColor={deviceColor}
            height={animationHeight}
            width={animationWidth}
        />
    );
};

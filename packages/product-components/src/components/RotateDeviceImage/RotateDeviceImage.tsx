import React from 'react';

import { DeviceModelInternal } from '@trezor/device-utils';

import { DeviceAnimation } from '../DeviceAnimation/DeviceAnimation';

export type RotateDeviceImageProps = {
    deviceModel?: DeviceModelInternal;
    deviceColor?: number;
    className?: string;
    animationHeight?: string;
    animationWidth?: string;
};

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

    return (
        <DeviceAnimation
            className={className}
            type="ROTATE"
            deviceModelInternal={deviceModel}
            deviceUnitColor={deviceColor}
            height={animationHeight}
            width={animationWidth}
        />
    );
};

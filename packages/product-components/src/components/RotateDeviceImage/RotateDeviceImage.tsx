import React from 'react';

import { DeviceAnimation } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/connect';

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

    // conflict here
    // const isDeviceImageRotating =
    //     deviceModel &&
    //     [
    //         DeviceModelInternal.T2B1,
    //         DeviceModelInternal.T3B1,
    //         DeviceModelInternal.T3T1,
    //         DeviceModelInternal.T3W1,
    //     ].includes(deviceModel);

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

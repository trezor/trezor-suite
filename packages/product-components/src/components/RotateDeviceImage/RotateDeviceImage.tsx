import React from 'react';

import { Icon } from '@trezor/components';
import { DeviceModelInternal, normalizeDeviceColorVariant } from '@trezor/device-utils';

import { mapTrezorModelToIcon } from '../../utils/mapTrezorModelToIcon';
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

    if (deviceModel === DeviceModelInternal.UNKNOWN) {
        return <Icon name={mapTrezorModelToIcon[DeviceModelInternal.T3T1]} size="extraLarge" />;
    }

    return (
        <DeviceAnimation
            loop={loop}
            className={className}
            type="ROTATE"
            deviceModelInternal={deviceModel}
            deviceUnitColor={normalizeDeviceColorVariant(deviceColor)}
            height={animationHeight}
            width={animationWidth}
        />
    );
};

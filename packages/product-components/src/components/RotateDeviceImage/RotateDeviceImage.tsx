import React from 'react';

import { AllowedAnimationPrimitiveFrameProps, Icon } from '@trezor/components';
import { DeviceModelInternal, normalizeDeviceColorVariant } from '@trezor/device-utils';

import { mapTrezorModelToIcon } from '../../utils/mapTrezorModelToIcon';
import { DeviceAnimation } from '../DeviceAnimation/DeviceAnimation';

export type RotateDeviceImageProps = AllowedAnimationPrimitiveFrameProps & {
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
    ...rest
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
            deviceModelInternal={
                deviceModel === DeviceModelInternal.T2B1 ? DeviceModelInternal.T3B1 : deviceModel
            }
            deviceUnitColor={normalizeDeviceColorVariant(deviceColor) as any}
            height={animationHeight}
            width={animationWidth}
            {...rest}
        />
    );
};

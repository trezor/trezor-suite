import React from 'react';
import { Icon, useTheme } from '@trezor/components';
import { TrezorDevice } from 'src/types/suite';
import { getDeviceModel } from '@trezor/device-utils';

interface DeviceIconProps {
    device: TrezorDevice;
    size: number;
    color?: string;
    hoverColor?: string;
    onClick?: any;
}

const DeviceIcon = ({
    device,
    size = 32,
    color,
    hoverColor,
    onClick,
    ...rest
}: DeviceIconProps) => {
    const theme = useTheme();
    const deviceModel = getDeviceModel(device);

    if (!deviceModel) {
        return null;
    }

    return (
        <Icon
            icon={`TREZOR_T${deviceModel}`}
            hoverColor={hoverColor}
            onClick={onClick}
            color={color ?? theme.TYPE_LIGHT_GREY}
            size={size}
            {...rest}
        />
    );
};

export default DeviceIcon;

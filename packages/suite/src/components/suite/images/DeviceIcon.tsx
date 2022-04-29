import React from 'react';
import { Icon, useTheme } from '@trezor/components';
import { TrezorDevice } from '@suite-types';

interface Props {
    device: TrezorDevice;
    size: number;
    color?: string;
    hoverColor?: string;
    onClick?: any;
}

const getDeviceIcon = (majorVersion: number) => {
    switch (majorVersion) {
        case 1:
            return 'T1';
        case 2:
            return 'T2';
        default:
            return 'T2';
    }
};

const DeviceIcon = ({ device, size = 32, color, hoverColor, onClick, ...rest }: Props) => {
    const theme = useTheme();
    const defaultColor = color ?? theme.TYPE_LIGHT_GREY;
    const majorVersion = device.features ? device.features.major_version : 2;
    const icon = getDeviceIcon(majorVersion);
    return (
        <Icon
            icon={icon}
            hoverColor={hoverColor}
            onClick={onClick}
            color={defaultColor}
            size={size}
            {...rest}
        />
    );
};

export default DeviceIcon;

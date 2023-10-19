import { Icon, useTheme } from '@trezor/components';
import { TrezorDevice } from 'src/types/suite';

interface DeviceIconProps {
    device: TrezorDevice;
    size: number;
    color?: string;
    hoverColor?: string;
    onClick?: any;
}

export const DeviceIcon = ({
    device,
    size = 32,
    color,
    hoverColor,
    onClick,
    ...rest
}: DeviceIconProps) => {
    const theme = useTheme();
    const deviceModelInternal = device.features?.internal_model;

    if (!deviceModelInternal) {
        return null;
    }

    return (
        <Icon
            icon={`TREZOR_${deviceModelInternal}`}
            hoverColor={hoverColor}
            onClick={onClick}
            color={color ?? theme.TYPE_LIGHT_GREY}
            size={size}
            {...rest}
        />
    );
};

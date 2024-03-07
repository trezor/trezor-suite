import { Image, ImageProps } from '@trezor/components';
import { Device } from '@trezor/connect';

interface DeviceConfirmImageProps extends Omit<ImageProps, 'image'> {
    device: Device;
}

export const DeviceConfirmImage = ({ device, ...rest }: DeviceConfirmImageProps) => {
    const deviceModelInternal = device.features?.internal_model;

    if (!deviceModelInternal) {
        return null;
    }

    const imgName = `DEVICE_CONFIRM_TREZOR_${deviceModelInternal}` as const;

    return <Image {...rest} image={imgName} />;
};

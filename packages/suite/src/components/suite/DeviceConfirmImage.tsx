import { TrezorDevice } from 'src/types/suite';
import { Image, ImageProps } from '@trezor/components';

interface DeviceConfirmImageProps extends Omit<ImageProps, 'image'> {
    device: TrezorDevice;
}

export const DeviceConfirmImage = ({ device, ...rest }: DeviceConfirmImageProps) => {
    const deviceModelInternal = device.features?.internal_model;

    if (!deviceModelInternal) {
        return null;
    }

    const imgName = `DEVICE_CONFIRM_TREZOR_${deviceModelInternal}` as const;

    return <Image {...rest} image={imgName} />;
};

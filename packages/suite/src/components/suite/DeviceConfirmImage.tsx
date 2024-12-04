import { TrezorDevice } from '@suite-common/suite-types';
import { Image, ImageProps, ImageKey } from '@trezor/components';
import { Device } from '@trezor/connect';

interface DeviceConfirmImageProps extends Omit<ImageProps, 'image'> {
    device: Device | TrezorDevice;
}

export const DeviceConfirmImage = ({ device }: DeviceConfirmImageProps) => {
    const deviceModelInternal = device.features?.internal_model;

    if (!deviceModelInternal) {
        return null;
    }

    const imgName: ImageKey = `DEVICE_CONFIRM_TREZOR_${deviceModelInternal}`;

    return <Image image={imgName} />;
};

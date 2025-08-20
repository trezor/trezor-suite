import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { Image, ImageKey, ImageProps } from '@trezor/components';
import { Device } from '@trezor/connect';
import { DeviceModelInternal } from '@trezor/device-utils';

type DeviceConfirmImageProps = Omit<ImageProps, 'image'> & {
    device: Pick<Device, 'features' | 'thp'>;
};

export const DeviceConfirmImage = ({ device }: DeviceConfirmImageProps) => {
    const deviceModelInternal = getDeviceInternalModel(device) ?? DeviceModelInternal.UNKNOWN;

    const imgName: ImageKey = `DEVICE_CONFIRM_TREZOR_${deviceModelInternal}`;

    return <Image image={imgName} />;
};

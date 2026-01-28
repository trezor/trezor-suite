import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { ImageProps } from '@trezor/components';
import { Device } from '@trezor/connect';
import { DeviceWithScene } from '@trezor/product-components';

type DeviceConfirmImageProps = Omit<ImageProps, 'image'> & {
    device?: Pick<Device, 'features' | 'thp'>;
} & {
    width?: number;
    height?: number;
};

export const DeviceConfirmImage = ({
    device,
    height = 300,
    width,
    ...rest
}: DeviceConfirmImageProps) => {
    const deviceModelInternal = getDeviceInternalModel(device);

    return (
        <DeviceWithScene
            deviceModel={deviceModelInternal}
            width={width}
            unitColor={device?.features?.unit_color}
            height={height}
            margin={20}
            {...rest}
        />
    );
};

import { TrezorDevice } from '@suite-common/suite-types';
import { getDeviceInternalModel } from '@suite-common/suite-utils';
import { ImageProps } from '@trezor/components';
import { DeviceModelInternal } from '@trezor/device-utils';
import { DeviceWithScene } from '@trezor/product-components';

type DeviceConfirmImageProps = Omit<ImageProps, 'image'> & {
    device?: TrezorDevice;
    width?: number;
    height?: number;
};

export const DeviceConfirmImage = ({ device, height = 360, width }: DeviceConfirmImageProps) => {
    const deviceModelInternal = getDeviceInternalModel(device);

    return (
        <DeviceWithScene
            deviceModel={deviceModelInternal}
            scene="confirm"
            width={width}
            unitColor={device?.features?.unit_color}
            height={height}
        />
    );
};

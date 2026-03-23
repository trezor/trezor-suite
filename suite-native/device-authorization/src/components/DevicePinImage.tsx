import { Image } from '@suite-native/atoms';
import { DeviceModelInternal } from '@trezor/device-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

const deviceImageMap: Record<DeviceModelInternal, string> = {
    [DeviceModelInternal.UNKNOWN]: require('../assets/pin-t3t1.webp'),
    [DeviceModelInternal.T1B1]: require('../assets/pin-t1b1.png'), // TODO: Discuss with Sheny
    [DeviceModelInternal.T2T1]: require('../assets/pin-t2t1.webp'),
    [DeviceModelInternal.T2B1]: require('../assets/pin-t3b1.webp'),
    [DeviceModelInternal.T3B1]: require('../assets/pin-t3b1.webp'),
    [DeviceModelInternal.T3T1]: require('../assets/pin-t3t1.webp'),
    [DeviceModelInternal.T3W1]: require('../assets/pin-t3w1.webp'),
};

const imageStyle = prepareNativeStyle<{ maxHeight?: number }>((_, { maxHeight }) => ({
    width: '100%',
    height: 400,
    maxHeight,
    contentFit: 'contain',
}));

type DevicePinImageProps = {
    deviceModel: DeviceModelInternal;
    maxHeight: number;
};

export const DevicePinImage = ({ deviceModel, maxHeight }: DevicePinImageProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Image source={deviceImageMap[deviceModel]} style={applyStyle(imageStyle, { maxHeight })} />
    );
};

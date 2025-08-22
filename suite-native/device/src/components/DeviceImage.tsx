import { Image } from '@suite-native/atoms';
import { DeviceModelInternal } from '@trezor/device-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles';

const deviceImageMap: Record<DeviceModelInternal, string> = {
    [DeviceModelInternal.UNKNOWN]: require('../assets/unknown.webp'),
    [DeviceModelInternal.T1B1]: require('../assets/t1b1.webp'),
    [DeviceModelInternal.T2T1]: require('../assets/t2t1.webp'),
    [DeviceModelInternal.T2B1]: require('../assets/t3b1.webp'),
    [DeviceModelInternal.T3B1]: require('../assets/t3b1.webp'),
    [DeviceModelInternal.T3T1]: require('../assets/t3t1.webp'),
    [DeviceModelInternal.T3W1]: require('../assets/t3w1.webp'),
};

type DeviceImageSize = 'normal' | 'large';
type DeviceImageDimensions = {
    width: number;
    height: number;
};

export const sizeToDimensionsMap = {
    normal: {
        width: 92,
        height: 151,
    },
    large: {
        width: 243,
        height: 400,
    },
} as const satisfies Record<DeviceImageSize, DeviceImageDimensions>;

const imageStyle = prepareNativeStyle<{ size: DeviceImageSize; maxHeight?: number }>(
    (_, { size, maxHeight }) => ({
        ...sizeToDimensionsMap[size],
        maxHeight,
        contentFit: 'contain',
    }),
);

type DeviceImageProps = {
    deviceModel: DeviceModelInternal;
    size?: DeviceImageSize;
    maxHeight?: number;
};

export const DeviceImage = ({ deviceModel, size = 'normal', maxHeight }: DeviceImageProps) => {
    const { applyStyle } = useNativeStyles();

    return (
        <Image
            source={deviceImageMap[deviceModel]}
            style={applyStyle(imageStyle, { size, maxHeight })}
        />
    );
};

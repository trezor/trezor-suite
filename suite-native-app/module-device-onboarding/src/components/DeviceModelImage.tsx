import { useWindowDimensions } from 'react-native';

import { Image } from '@suite-native/atoms';
import { DeviceModelInternal } from '@trezor/device-utils';
import { prepareNativeStyle, useNativeStyles } from '@trezor/styles-native';

type DeviceImageSize = 'normal' | 'small';

type DeviceModelImageProps = {
    deviceModel: DeviceModelInternal;
    size: DeviceImageSize;
};

type DeviceModelWithImage = Exclude<DeviceModelInternal, DeviceModelInternal.UNKNOWN>;

const deviceModelImageMap = {
    // Note: although T1B1 onboarding is not supported, the Visual Device Check for already initialized device is supported.
    // That's why don't need T1B1 in SecuritySealImages, but we do need it here.
    [DeviceModelInternal.T1B1]: require('../assets/t1b1.webp'),
    [DeviceModelInternal.T2T1]: require('../assets/t2t1.webp'),
    [DeviceModelInternal.T2B1]: require('../assets/t3b1.webp'),
    [DeviceModelInternal.T3B1]: require('../assets/t3b1.webp'),
    [DeviceModelInternal.T3T1]: require('../assets/t3t1.webp'),
    [DeviceModelInternal.T3W1]: require('../assets/t3w1.webp'),
} as const satisfies Record<DeviceModelWithImage, string>;

// Get device model with available image → fallback unknown device to T3W1 (unknown device cannot have an image, it's appearance is unknown).
const getDeviceModelForDisplay = (deviceModel: DeviceModelInternal): DeviceModelWithImage =>
    deviceModel === DeviceModelInternal.UNKNOWN ? DeviceModelInternal.T3W1 : deviceModel;

const sizeToHeightMap = {
    normal: 360,
    small: 280,
} as const satisfies Record<DeviceImageSize, number>;

const MAX_HEIGHT_RATIO = 2 / 3;

const deviceImageStyle = prepareNativeStyle<{ size: DeviceImageSize; windowHeight: number }>(
    (_, { size, windowHeight }) => ({
        width: '100%',
        height: sizeToHeightMap[size],
        maxHeight: windowHeight * MAX_HEIGHT_RATIO,
        alignItems: 'center',
    }),
);

export const DeviceModelImage = ({ deviceModel, size }: DeviceModelImageProps) => {
    const { applyStyle } = useNativeStyles();
    const { height: windowHeight } = useWindowDimensions();

    return (
        <Image
            source={deviceModelImageMap[getDeviceModelForDisplay(deviceModel)]}
            contentFit="contain"
            style={applyStyle(deviceImageStyle, { size, windowHeight })}
        />
    );
};
